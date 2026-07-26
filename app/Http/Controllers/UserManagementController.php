<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin (freelancer-only) view of every registered account: headline counts,
 * how many people signed up per day / month / year, and a searchable,
 * paginated list of all users.
 */
class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('ManageUsers', $this->baseProps($request));
    }

    /**
     * Stats, chart, filters and the paginated list — shared by index() and
     * scan() (which adds a `flagged` prop on top).
     */
    private function baseProps(Request $request): array
    {
        $filters = [
            'search' => trim((string) $request->query('search')) ?: null,
            'role' => in_array($request->query('role'), ['client', 'freelancer'], true)
                ? $request->query('role')
                : null,
        ];

        $users = User::query()
            ->when($filters['search'], function ($q, $search) {
                $q->where(fn ($w) => $w
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%"));
            })
            ->when($filters['role'], fn ($q, $role) => $q->where('role', $role))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'verified' => $u->email_verified_at !== null,
                'google' => $u->google_id !== null,
                'joined' => $u->created_at?->toDateString(),
                'joined_human' => $u->created_at?->diffForHumans(),
            ]);

        return [
            'stats' => $this->stats(),
            'chart' => $this->registrationSeries(),
            'users' => $users,
            'filters' => $filters,
        ];
    }

    /**
     * Permanently delete one account. Freelancer accounts are protected (there
     * is exactly one, seeded, and it must never be removable from here).
     */
    public function destroy(User $user): RedirectResponse
    {
        if ($user->isFreelancer()) {
            return back()->with('error', 'Freelancer accounts cannot be deleted here.');
        }

        $name = $user->name;
        $user->delete(); // cascades to their tasks, messages, payments, etc.

        return back()->with('success', "Deleted {$name}.");
    }

    /**
     * Delete several client accounts at once (used by "Delete all flagged").
     */
    public function bulkDestroy(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'max:200'],
            'ids.*' => ['integer'],
        ]);

        $deleted = User::whereIn('id', $data['ids'])
            ->where('role', '!=', 'freelancer') // never delete the freelancer
            ->get()
            ->each
            ->delete()
            ->count();

        return back()->with('success', "Deleted {$deleted} account(s).");
    }

    /**
     * Run the AI/heuristic screener over client accounts and return the ones
     * that look like OnlyFans/adult spam, scams, or bots for the admin to review
     * and delete. Never deletes automatically.
     */
    public function scan(Request $request): JsonResponse
    {
        $candidates = User::where('role', '!=', 'freelancer')
            ->latest()
            ->limit(200) // bound the batch so one AI call stays fast
            ->get(['id', 'name', 'email', 'headline', 'bio']);

        $verdicts = collect(\App\Support\AiUserScreener::scan($candidates->map(fn (User $u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'headline' => $u->headline,
            'bio' => $u->bio,
        ])->all()))->keyBy('id');

        $byId = $candidates->keyBy('id');
        $order = ['high' => 0, 'medium' => 1, 'low' => 2];

        $flagged = $verdicts
            ->map(fn ($v) => [
                'id' => $v['id'],
                'name' => $byId[$v['id']]->name ?? '',
                'email' => $byId[$v['id']]->email ?? '',
                'risk' => $v['risk'],
                'reason' => $v['reason'],
            ])
            ->sortBy(fn ($f) => $order[$f['risk']] ?? 3)
            ->values()
            ->all();

        // Return JSON (not an Inertia page) so the scan never changes the URL —
        // otherwise the dashboard's periodic reload would re-GET /users/scan and
        // 405, since this endpoint is POST-only.
        return response()->json([
            'flagged' => $flagged,
            'via' => \App\Support\AiUserScreener::aiEnabled() ? 'ai' : 'heuristic',
        ]);
    }

    /**
     * Email a verification link to an unverified user (admin action).
     */
    public function sendVerification(User $user): RedirectResponse
    {
        if ($user->hasVerifiedEmail()) {
            return back()->with('error', "{$user->name} is already verified.");
        }

        // Don't pretend to send when there's no real mailer — the default "log"
        // (and "array") drivers deliver nothing, so warn instead of faking success.
        if (in_array(config('mail.default'), ['log', 'array'], true)) {
            return back()->with('error', 'Email sending is not configured yet, so nothing was sent.');
        }

        try {
            $user->sendEmailVerificationNotification();
        } catch (\Throwable $e) {
            report($e);

            return back()->with('error', 'Could not send the email — check the mail settings.');
        }

        return back()->with('success', "Verification link sent to {$user->email}.");
    }

    /**
     * Headline counts shown as stat cards.
     */
    private function stats(): array
    {
        return [
            'total' => User::count(),
            'clients' => User::where('role', 'client')->count(),
            'freelancers' => User::where('role', 'freelancer')->count(),
            'verified' => User::whereNotNull('email_verified_at')->count(),
            'today' => User::whereDate('created_at', Carbon::today())->count(),
            'week' => User::where('created_at', '>=', Carbon::now()->startOfWeek())->count(),
            'month' => User::where('created_at', '>=', Carbon::now()->startOfMonth())->count(),
            'year' => User::where('created_at', '>=', Carbon::now()->startOfYear())->count(),
        ];
    }

    /**
     * Registrations over time in the {daily, monthly, yearly} shape the shared
     * LineChart expects. User counts are small, so one pass in PHP keeps this
     * database-agnostic (matches the visitor analytics approach).
     */
    private function registrationSeries(): array
    {
        $rows = User::query()->get(['created_at']);

        $bucket = function (int $count, string $unit, string $format, callable $start) use ($rows) {
            $out = [];
            for ($i = $count - 1; $i >= 0; $i--) {
                $from = $start($i);
                $to = (clone $from)->add($unit, 1);
                $out[] = [
                    'label' => $from->format($format),
                    'value' => $rows->filter(fn ($r) => $r->created_at
                        && $r->created_at->gte($from) && $r->created_at->lt($to))->count(),
                ];
            }

            return $out;
        };

        return [
            'daily' => $bucket(14, 'day', 'M j', fn ($i) => Carbon::today()->subDays($i)),
            'monthly' => $bucket(12, 'month', 'M Y', fn ($i) => Carbon::today()->startOfMonth()->subMonths($i)),
            'yearly' => $bucket(6, 'year', 'Y', fn ($i) => Carbon::today()->startOfYear()->subYears($i)),
        ];
    }
}
