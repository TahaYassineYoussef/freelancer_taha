<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Signal;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function index(Request $request): Response
    {
        $me = $request->user();
        $partners = $this->partnersFor($me);

        // Determine the currently selected conversation partner.
        $selectedId = $request->integer('with');
        $selected = $partners->firstWhere('id', $selectedId) ?? $partners->first();

        $messages = $selected
            ? $this->conversation($me->id, $selected->id)
            : collect();

        if ($selected) {
            $this->markRead($me->id, $selected->id);
        }

        // Unread count per conversation (computed after marking the open one read,
        // so the selected conversation correctly shows zero).
        $unreadBySender = Message::where('receiver_id', $me->id)
            ->whereNull('read_at')
            ->selectRaw('sender_id, count(*) as total')
            ->groupBy('sender_id')
            ->pluck('total', 'sender_id');

        $partners->each(fn ($p) => $p->unread = (int) ($unreadBySender[$p->id] ?? 0));

        return Inertia::render('Chat', [
            'partners' => $partners->values(),
            'selectedPartner' => $selected,
            'messages' => $messages,
        ]);
    }

    /**
     * The front-end polls this ~1s: it returns the conversation, marks incoming
     * messages read, and drains any real-time signals (typing / call handshake)
     * the partner has sent us. Signals are consumed once and then deleted.
     */
    public function poll(Request $request, User $user): JsonResponse
    {
        $me = $request->user();
        $this->assertCanChat($me, $user);

        $this->markRead($me->id, $user->id);

        // Drain only typing pings from this partner (consume-once). Call signals
        // (offer/answer/ice/…) are handled globally by CallController so a user
        // is rung on any page, not just this open conversation.
        $signals = Signal::where('to_id', $me->id)
            ->where('from_id', $user->id)
            ->where('kind', 'typing')
            ->orderBy('id')
            ->get(['id', 'kind', 'payload']);

        if ($signals->isNotEmpty()) {
            Signal::whereIn('id', $signals->pluck('id'))->delete();
        }

        return response()->json([
            'messages' => $this->conversation($me->id, $user->id),
            'signals' => $signals->map(fn ($s) => ['kind' => $s->kind, 'payload' => $s->payload])->values(),
        ]);
    }

    /**
     * Backwards-compatible: return the conversation (used by older callers/tests).
     */
    public function fetch(Request $request, User $user): JsonResponse
    {
        $me = $request->user();
        $this->assertCanChat($me, $user);

        $this->markRead($me->id, $user->id);

        return response()->json(['messages' => $this->conversation($me->id, $user->id)]);
    }

    public function store(Request $request, User $user): JsonResponse
    {
        $me = $request->user();
        $this->assertCanChat($me, $user);

        // Validate manually and return JSON on failure. This route is a *web*
        // route hit via axios (not api/*), and the app only auto-renders
        // validation exceptions as JSON for api/* paths — so a thrown
        // ValidationException would redirect instead of giving the front-end a
        // readable error. Returning JSON here keeps the error visible in chat.
        //
        // We validate the attachment by its extension rather than its sniffed
        // MIME type: Windows/WAMP PHP frequently reports a .docx/.xlsx as
        // application/zip (or octet-stream), which makes the `mimes` rule
        // wrongly reject Word and Office documents. `extensions` checks the
        // real extension instead, so PDF and Word files always go through.
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'body' => ['nullable', 'string', 'max:2000'],
            'attachment' => ['nullable', 'file', 'max:25600', // 25 MB
                'extensions:jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip,rar,mp3,mp4,mov'],
        ], [
            'attachment.extensions' => 'That file type is not allowed. You can send images, PDF, Word, Excel, PowerPoint, text, or archive files.',
            'attachment.max' => 'That file is too big (max 25 MB).',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $data = $validator->validated();

        if (blank($data['body'] ?? null) && ! $request->hasFile('attachment')) {
            return response()->json(['message' => 'Type a message or attach a file.'], 422);
        }

        $attributes = [
            'sender_id' => $me->id,
            'receiver_id' => $user->id,
            'body' => $data['body'] ?? null,
        ];

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            // Store on the configured disk: local "public" in dev, "s3"
            // (Cloudflare R2) in production, since Vercel's filesystem is
            // read-only and can't persist uploads.
            $attributes['attachment_path'] = $file->store('chat', config('filesystems.chat_disk'));
            $attributes['attachment_name'] = $file->getClientOriginalName();
            $attributes['attachment_mime'] = $file->getMimeType();
        }

        $message = Message::create($attributes);

        $preview = $message->body
            ? "{$me->name}: ".Str::limit($message->body, 60)
            : "{$me->name} sent an attachment 📎";

        $user->notify(new \App\Notifications\ActivityNotification(
            'message',
            'New message',
            $preview,
            route('chat.index', ['with' => $me->id]),
            '💬',
        ));

        return response()->json(['messages' => $this->conversation($me->id, $user->id)]);
    }

    /**
     * Store one real-time signal for the partner to pick up on their next poll.
     * Used for the typing indicator and the WebRTC call handshake.
     */
    public function signal(Request $request, User $user): JsonResponse
    {
        $me = $request->user();
        $this->assertCanChat($me, $user);

        $data = $request->validate([
            'kind' => ['required', 'string', 'in:typing'],
            'payload' => ['nullable', 'string'],
        ]);

        // Typing pings are noisy; keep only the latest per sender/receiver.
        Signal::where('from_id', $me->id)->where('to_id', $user->id)->where('kind', 'typing')->delete();

        Signal::create([
            'from_id' => $me->id,
            'to_id' => $user->id,
            'kind' => $data['kind'],
            'payload' => $data['payload'] ?? null,
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * Who the given user is allowed to talk to.
     * - The freelancer talks to every client.
     * - A client talks only to the freelancer.
     */
    private function partnersFor(User $me)
    {
        if ($me->isFreelancer()) {
            return User::where('role', 'client')
                ->orderBy('name')
                ->get(['id', 'name', 'role']);
        }

        return User::where('role', 'freelancer')
            ->orderBy('name')
            ->get(['id', 'name', 'role']);
    }

    private function assertCanChat(User $me, User $other): void
    {
        $allowed = $me->isFreelancer()
            ? $other->role === 'client'
            : $other->role === 'freelancer';

        abort_unless($allowed, 403);
    }

    private function conversation(int $meId, int $otherId)
    {
        return Message::query()
            ->where(fn ($q) => $q->where('sender_id', $meId)->where('receiver_id', $otherId))
            ->orWhere(fn ($q) => $q->where('sender_id', $otherId)->where('receiver_id', $meId))
            ->orderBy('created_at')
            ->get()
            ->map(fn (Message $m) => [
                'id' => $m->id,
                'sender_id' => $m->sender_id,
                'receiver_id' => $m->receiver_id,
                'body' => $m->body,
                'attachment_url' => $m->attachmentUrl(),
                'attachment_name' => $m->attachment_name,
                'attachment_mime' => $m->attachment_mime,
                'call_kind' => $m->call_kind,
                'call_status' => $m->call_status,
                'call_seconds' => $m->call_seconds,
                'read' => $m->read_at !== null,
                'created_at' => $m->created_at,
            ]);
    }

    private function markRead(int $meId, int $otherId): void
    {
        Message::where('sender_id', $otherId)
            ->where('receiver_id', $meId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }
}
