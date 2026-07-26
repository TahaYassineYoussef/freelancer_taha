<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    private function freelancer(): User
    {
        return User::factory()->create(['role' => 'freelancer']);
    }

    private function client(): User
    {
        return User::factory()->create(['role' => 'client']);
    }

    public function test_client_can_send_a_text_message_to_the_freelancer(): void
    {
        $freelancer = $this->freelancer();
        $client = $this->client();

        $this->actingAs($client)
            ->postJson(route('chat.store', $freelancer->id), ['body' => 'Hello Taha'])
            ->assertOk();

        $this->assertDatabaseHas('messages', [
            'sender_id' => $client->id,
            'receiver_id' => $freelancer->id,
            'body' => 'Hello Taha',
        ]);
    }

    public function test_client_can_send_an_image_attachment(): void
    {
        Storage::fake('public');
        $freelancer = $this->freelancer();
        $client = $this->client();

        $this->actingAs($client)
            ->post(route('chat.store', $freelancer->id), [
                'attachment' => UploadedFile::fake()->image('brief.png'),
            ])
            ->assertOk();

        $message = \App\Models\Message::first();
        $this->assertNotNull($message->attachment_path);
        $this->assertSame('brief.png', $message->attachment_name);
        Storage::disk('public')->assertExists($message->attachment_path);
    }

    public function test_client_can_send_pdf_and_word_documents(): void
    {
        Storage::fake('public');
        $freelancer = $this->freelancer();
        $client = $this->client();

        foreach (['contract.pdf', 'brief.docx', 'notes.doc'] as $name) {
            $this->actingAs($client)
                ->post(route('chat.store', $freelancer->id), [
                    'attachment' => UploadedFile::fake()->create($name, 200),
                ])
                ->assertOk();
        }

        $this->assertSame(3, \App\Models\Message::whereNotNull('attachment_path')->count());
    }

    public function test_disallowed_file_type_is_rejected(): void
    {
        Storage::fake('public');
        $freelancer = $this->freelancer();
        $client = $this->client();

        $this->actingAs($client)
            ->post(route('chat.store', $freelancer->id), [
                'attachment' => UploadedFile::fake()->create('malware.exe', 100),
            ], ['Accept' => 'application/json'])
            ->assertStatus(422);
    }

    public function test_empty_message_with_no_attachment_is_rejected(): void
    {
        $freelancer = $this->freelancer();
        $client = $this->client();

        $this->actingAs($client)
            ->postJson(route('chat.store', $freelancer->id), ['body' => ''])
            ->assertStatus(422);
    }

    public function test_typing_signal_is_delivered_through_the_poll(): void
    {
        $freelancer = $this->freelancer();
        $client = $this->client();

        // Client signals "typing" to the freelancer.
        $this->actingAs($client)
            ->postJson(route('chat.signal', $freelancer->id), ['kind' => 'typing'])
            ->assertOk();

        // Freelancer polls the conversation and receives it once.
        $res = $this->actingAs($freelancer)->getJson(route('chat.poll', $client->id))->assertOk();
        $this->assertSame('typing', $res->json('signals.0.kind'));

        // Signals are consumed — a second poll is empty.
        $this->actingAs($freelancer)
            ->getJson(route('chat.poll', $client->id))
            ->assertJsonCount(0, 'signals');
    }

    public function test_a_client_cannot_message_another_client(): void
    {
        $client = $this->client();
        $other = $this->client();

        $this->actingAs($client)
            ->postJson(route('chat.store', $other->id), ['body' => 'hi'])
            ->assertForbidden();
    }
}
