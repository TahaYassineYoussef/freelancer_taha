<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_freelancer_sees_stats_chart_and_paginated_users(): void
    {
        $freelancer = User::factory()->create(['role' => 'freelancer']);
        User::factory()->count(15)->create(['role' => 'client']);

        $this->actingAs($freelancer)
            ->get(route('users.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ManageUsers')
                ->where('stats.total', 16)
                ->where('stats.clients', 15)
                ->where('stats.freelancers', 1)
                ->has('chart.daily')
                ->has('chart.monthly')
                ->has('chart.yearly')
                ->has('users.data', 10)      // first page holds 10 of 16
                ->where('users.total', 16)
                ->where('users.last_page', 2));
    }

    public function test_client_is_forbidden(): void
    {
        $client = User::factory()->create(['role' => 'client']);

        $this->actingAs($client)
            ->get(route('users.index'))
            ->assertForbidden();
    }

    public function test_search_filters_the_list(): void
    {
        $freelancer = User::factory()->create(['role' => 'freelancer']);
        User::factory()->create(['role' => 'client', 'name' => 'Zebra Person', 'email' => 'zebra@example.com']);
        User::factory()->count(5)->create(['role' => 'client']);

        $this->actingAs($freelancer)
            ->get(route('users.index', ['search' => 'zebra']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('users.total', 1)
                ->where('users.data.0.name', 'Zebra Person'));
    }
}
