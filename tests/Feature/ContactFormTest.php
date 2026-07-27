<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactFormTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Real Client',
            'email' => 'real@gmail.com',
            'subject' => 'Project inquiry',
            'body' => 'Hi Taha, I would like to hire you to build a website.',
            'website' => '',      // honeypot left empty (human)
            'elapsed' => 6000,    // spent 6s on the form (human)
        ], $overrides);
    }

    public function test_a_genuine_message_is_saved(): void
    {
        User::factory()->create(['role' => 'freelancer']);

        $this->post(route('contact.store'), $this->payload())->assertRedirect();

        $this->assertDatabaseHas('contact_messages', ['email' => 'real@gmail.com']);
    }

    public function test_filled_honeypot_is_silently_dropped(): void
    {
        $this->post(route('contact.store'), $this->payload(['website' => 'http://spam.example']))
            ->assertRedirect();

        $this->assertDatabaseCount('contact_messages', 0);
    }

    public function test_instant_submissions_are_dropped(): void
    {
        $this->post(route('contact.store'), $this->payload(['elapsed' => 300]))
            ->assertRedirect();

        $this->assertDatabaseCount('contact_messages', 0);
    }

    public function test_submissions_with_no_timer_are_dropped(): void
    {
        $payload = $this->payload();
        unset($payload['elapsed']);

        $this->post(route('contact.store'), $payload)->assertRedirect();

        $this->assertDatabaseCount('contact_messages', 0);
    }
}
