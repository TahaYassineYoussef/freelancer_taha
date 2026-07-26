<?php

namespace App\Http\Middleware;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'unreadMessages' => fn () => $request->user()
                    ? Message::where('receiver_id', $request->user()->id)->whereNull('read_at')->count()
                    : 0,
                'notifications' => fn () => $this->notifications($request),
                'pendingRevisions' => fn () => $request->user()?->isFreelancer()
                    ? \App\Models\Task::whereNotNull('revision_note')->where('status', 'in_progress')->count()
                    : 0,
                'newTasks' => fn () => $request->user()?->isFreelancer()
                    ? \App\Models\Task::where('status', 'open')->count()
                    : 0,
                'pendingDeliveries' => fn () => ($request->user() && ! $request->user()->isFreelancer())
                    ? $request->user()->tasks()->where('status', 'delivered')->count()
                    : 0,
                'pendingBookings' => fn () => $request->user()?->isFreelancer()
                    ? \App\Models\Booking::where('status', 'pending')->count()
                    : 0,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            // Only show the "Continue with Google" button once OAuth is fully set up.
            // Both halves are required: the ID alone would render a button that
            // fails at the token-exchange step.
            'googleEnabled' => (bool) config('services.google.client_id')
                && (bool) config('services.google.client_secret'),
            'paypal' => fn () => [
                // Prefer what the freelancer saved in Payment Settings; fall back to .env.
                'clientId' => $this->freelancer()?->paypal_client_id
                    ?: config('services.paypal.client_id'),
                'currency' => config('services.paypal.currency', 'USD'),
                // Show/hide toggle from Payment Settings (credentials stay saved).
                // Falls back to the .env switch when no account exists yet.
                'enabled' => (bool) ($this->freelancer()?->paypal_enabled ?? config('services.paypal.enabled')),
            ],
            'd17' => fn () => $this->d17Details(),
            // Public Supabase Realtime config for instant call signalling. Only
            // shared to signed-in users (guests never place calls).
            'supabase' => $request->user() ? [
                'url' => config('services.supabase.url'),
                'anonKey' => config('services.supabase.anon_key'),
            ] : null,
            'locale' => app()->getLocale(),
            'dir' => app()->getLocale() === 'ar' ? 'rtl' : 'ltr',
            'translations' => fn () => $this->translations(),
        ];
    }

    /**
     * The active locale's messages, layered over English so any untranslated
     * key still shows readable text.
     *
     * @return array<string, string>
     */
    private function translations(): array
    {
        $load = function (string $locale): array {
            $path = base_path("lang/{$locale}.json");

            return is_file($path)
                ? (json_decode((string) file_get_contents($path), true) ?: [])
                : [];
        };

        return array_merge($load('en'), $load(app()->getLocale()));
    }

    /**
     * The freelancer's D17 (DigiPost) wallet details, shown to clients when paying.
     */
    private function d17Details(): array
    {
        $freelancer = $this->freelancer();

        return [
            'number' => $freelancer?->d17_number,
            'qr' => $freelancer?->d17_qr ? Storage::url($freelancer->d17_qr) : null,
            // Show/hide toggle from Payment Settings (wallet details stay saved).
            'enabled' => (bool) ($freelancer?->d17_enabled ?? true),
        ];
    }

    /**
     * Unread count + the 10 most recent in-app notifications for the bell.
     *
     * @return array{unread:int, items:array}
     */
    private function notifications(Request $request): array
    {
        $user = $request->user();

        if (! $user) {
            return ['unread' => 0, 'items' => []];
        }

        $items = $user->notifications()->latest()->limit(10)->get()->map(fn ($n) => [
            'id' => $n->id,
            'read' => $n->read_at !== null,
            'created_at' => $n->created_at,
            ...$n->data,
        ]);

        return [
            'unread' => $user->unreadNotifications()->count(),
            'items' => $items,
        ];
    }

    private ?User $freelancer = null;

    private function freelancer(): ?User
    {
        return $this->freelancer ??= User::where('role', 'freelancer')
            ->first(['id', 'd17_number', 'd17_qr', 'd17_enabled', 'paypal_client_id', 'paypal_enabled']);
    }
}
