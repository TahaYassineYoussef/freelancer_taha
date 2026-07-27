<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\User;
use App\Notifications\ActivityNotification;
use App\Support\Notifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    /**
     * Public contact form — no account needed.
     */
    public function store(Request $request): RedirectResponse
    {
        // --- Bot traps (silent) --------------------------------------------
        // A real, human submission always: leaves the hidden honeypot empty,
        // and takes at least a couple of seconds to fill in. Bots trip one of
        // these. We pretend it worked so the bot moves on and never retries.
        $tripped = filled($request->input('website'))          // honeypot filled
            || (int) $request->input('elapsed') < 2500;         // submitted in < 2.5s (or no JS timer at all)

        if ($tripped) {
            return back()->with('success', 'Thanks for reaching out! Taha will reply to you by email soon.');
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', new \App\Rules\CleanText('a contact message name')],
            'email' => ['required', 'email', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:5000', new \App\Rules\CleanText('a contact message')],
        ]);

        $contact = ContactMessage::create($data);

        Notifier::send(User::where('role', 'freelancer')->first(), new ActivityNotification(
            'contact',
            'New contact message',
            "{$contact->name}: ".Str::limit($contact->body, 60),
            route('contact.index', ['msg' => $contact->id]),
            '✉️',
        ));

        return back()->with('success', 'Thanks for reaching out! Taha will reply to you by email soon.');
    }

    /**
     * Inbox for the freelancer.
     */
    public function index(): Response
    {
        $messages = ContactMessage::latest()->get();

        // Opening the inbox marks everything as read.
        ContactMessage::whereNull('read_at')->update(['read_at' => now()]);

        return Inertia::render('ContactMessages', [
            'messages' => $messages,
        ]);
    }

    public function destroy(ContactMessage $contactMessage): RedirectResponse
    {
        $contactMessage->delete();

        return back()->with('success', 'Message deleted.');
    }
}
