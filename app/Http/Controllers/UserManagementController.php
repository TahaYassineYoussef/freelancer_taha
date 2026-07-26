<?php

namespace App\Http\Controllers;

use App\Models\User;
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

        return Inertia::render('ManageUsers', [
            'stats' => $this->stats(),
            'chart' => $this->registrationSeries(),
            'users' => $users,
            'filters' => $filters,
        ]);
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
