<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PrivacyPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_signed_in_user_can_view_the_privacy_page(): void
    {
        $user = User::factory()->create(['role' => 'client']);

        $this->actingAs($user)
            ->get(route('privacy'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Privacy'));
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('privacy'))->assertRedirect(route('login'));
    }

    public function test_user_can_change_their_password(): void
    {
        $user = User::factory()->create(['password' => bcrypt('old-password')]);

        $this->actingAs($user)
            ->from(route('privacy'))
            ->put(route('password.update'), [
                'current_password' => 'old-password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ])
            ->assertRedirect(route('privacy'));

        $this->assertTrue(password_verify('new-password', $user->fresh()->password));
    }
}
