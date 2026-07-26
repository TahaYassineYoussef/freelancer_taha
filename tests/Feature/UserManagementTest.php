<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
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

    public function test_freelancer_can_send_a_verification_link(): void
    {
        Notification::fake();
        config(['mail.default' => 'smtp']); // pretend a real mailer is configured
        $freelancer = User::factory()->create(['role' => 'freelancer']);
        $client = User::factory()->unverified()->create(['role' => 'client']);

        $this->actingAs($freelancer)
            ->post(route('users.sendVerification', $client))
            ->assertRedirect();

        Notification::assertSentTo($client, VerifyEmail::class);
    }

    public function test_verification_link_is_not_sent_to_already_verified_user(): void
    {
        Notification::fake();
        $freelancer = User::factory()->create(['role' => 'freelancer']);
        $client = User::factory()->create(['role' => 'client']); // verified by default

        $this->actingAs($freelancer)
            ->post(route('users.sendVerification', $client))
            ->assertSessionHas('error');

        Notification::assertNothingSent();
    }

    public function test_client_cannot_send_verification_links(): void
    {
        Notification::fake();
        $client = User::factory()->create(['role' => 'client']);
        $target = User::factory()->unverified()->create(['role' => 'client']);

        $this->actingAs($client)
            ->post(route('users.sendVerification', $target))
            ->assertForbidden();

        Notification::assertNothingSent();
    }

    public function test_freelancer_can_delete_a_client(): void
    {
        $freelancer = User::factory()->create(['role' => 'freelancer']);
        $client = User::factory()->create(['role' => 'client']);

        $this->actingAs($freelancer)
            ->delete(route('users.destroy', $client))
            ->assertRedirect();

        $this->assertDatabaseMissing('users', ['id' => $client->id]);
    }

    public function test_freelancer_account_cannot_be_deleted(): void
    {
        $freelancer = User::factory()->create(['role' => 'freelancer']);
        $other = User::factory()->create(['role' => 'freelancer']);

        $this->actingAs($freelancer)
            ->delete(route('users.destroy', $other))
            ->assertSessionHas('error');

        $this->assertDatabaseHas('users', ['id' => $other->id]);
    }

    public function test_client_cannot_delete_users(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $target = User::factory()->create(['role' => 'client']);

        $this->actingAs($client)
            ->delete(route('users.destroy', $target))
            ->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $target->id]);
    }

    public function test_bulk_delete_removes_clients_but_never_the_freelancer(): void
    {
        $freelancer = User::factory()->create(['role' => 'freelancer']);
        $c1 = User::factory()->create(['role' => 'client']);
        $c2 = User::factory()->create(['role' => 'client']);

        $this->actingAs($freelancer)
            ->post(route('users.bulkDestroy'), ['ids' => [$c1->id, $c2->id, $freelancer->id]])
            ->assertRedirect();

        $this->assertDatabaseMissing('users', ['id' => $c1->id]);
        $this->assertDatabaseMissing('users', ['id' => $c2->id]);
        $this->assertDatabaseHas('users', ['id' => $freelancer->id]);
    }

    public function test_scan_flags_onlyfans_spam_and_spares_real_clients(): void
    {
        $freelancer = User::factory()->create(['role' => 'freelancer']);
        User::factory()->create([
            'role' => 'client', 'name' => 'John Doe', 'email' => 'john@gmail.com',
            'bio' => 'Looking for a web developer to build my bakery site.',
        ]);
        $spam = User::factory()->create([
            'role' => 'client', 'name' => 'Hot Girl', 'email' => 'hotgirl@gmail.com',
            'bio' => 'check out my onlyfans, link in bio',
        ]);

        $this->actingAs($freelancer)
            ->postJson(route('users.scan'))
            ->assertOk()
            ->assertJsonPath('via', 'heuristic')
            ->assertJsonCount(1, 'flagged')
            ->assertJsonPath('flagged.0.id', $spam->id)
            ->assertJsonPath('flagged.0.risk', 'high');
    }

    public function test_scan_flags_non_real_email_domains(): void
    {
        $freelancer = User::factory()->create(['role' => 'freelancer']);
        User::factory()->create([
            'role' => 'client', 'name' => 'Real Client', 'email' => 'real@gmail.com',
            'bio' => 'Need a portfolio site built.',
        ]);
        $fake = User::factory()->create([
            'role' => 'client', 'name' => 'Client', 'email' => 'client@freelancer.test', 'bio' => null,
        ]);

        $this->actingAs($freelancer)
            ->postJson(route('users.scan'))
            ->assertOk()
            ->assertJsonCount(1, 'flagged')
            ->assertJsonPath('flagged.0.id', $fake->id)
            ->assertJsonPath('flagged.0.risk', 'high');
    }

    public function test_scan_flags_disposable_email_accounts(): void
    {
        $freelancer = User::factory()->create(['role' => 'freelancer']);
        User::factory()->create([
            'role' => 'client', 'name' => 'Real Client', 'email' => 'real.client@gmail.com',
            'bio' => 'Need a landing page for my shop.',
        ]);
        $fake = User::factory()->create([
            'role' => 'client', 'name' => 'Temp User', 'email' => 'abc@mailinator.com', 'bio' => null,
        ]);

        $this->actingAs($freelancer)
            ->postJson(route('users.scan'))
            ->assertOk()
            ->assertJsonCount(1, 'flagged')
            ->assertJsonPath('flagged.0.id', $fake->id)
            ->assertJsonPath('flagged.0.risk', 'high');
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
