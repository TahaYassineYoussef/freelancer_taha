<?php

namespace App\Rules;

use App\Models\ModerationLog;
use App\Support\AiModerator;
use App\Support\ContentModerator;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Throwable;

/**
 * Rejects text containing profanity, insults, scams or spam.
 *
 * Two layers:
 *  1. ContentModerator — a local word/pattern list. Free, instant, always runs.
 *  2. AiModerator — Claude. Catches what the list misses (new slang, disguised
 *     insults, creative scams) with no list to maintain. Skipped when no API key
 *     is configured, and never blocks a submission if the API is unreachable.
 *
 * Every rejection is recorded so the freelancer can review it under "Blocked".
 */
class CleanText implements ValidationRule
{
    public function __construct(private string $context = 'user submitted text', private bool $strict = false)
    {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || trim($value) === '') {
            return;
        }

        // --- Layer 1: local list (free, catches the obvious cases instantly) ---
        if (ContentModerator::findProfanity($value)) {
            $message = 'Please keep it professional — offensive language is not allowed.';
            $this->record($attribute, $value, 'profanity', $message, 'word_list');
            $fail($message);

            return;
        }

        // Strict mode (identity fields like display names): also block sexual /
        // adult-content terms, which are never legitimate in a name.
        if ($this->strict && ContentModerator::findAdult($value)) {
            $message = 'Please use a real, appropriate name.';
            $this->record($attribute, $value, 'adult', $message, 'word_list');
            $fail($message);

            return;
        }

        if ($reason = ContentModerator::findScam($value)) {
            $message = "This looks like spam or a scam ({$reason}). Please rewrite it.";
            $this->record($attribute, $value, 'scam', $message, 'word_list');
            $fail($message);

            return;
        }

        // --- Layer 2: AI (catches what the list cannot) ---
        $verdict = AiModerator::check($value, $this->context);

        if ($verdict !== null && $verdict['allowed'] === false) {
            $message = $verdict['reason'] !== ''
                ? $verdict['reason']
                : 'This content was flagged as inappropriate. Please rewrite it.';

            $this->record($attribute, $value, $verdict['category'] ?: 'flagged', $message, 'ai');
            $fail($message);
        }
    }

    /**
     * Log the blocked attempt. Logging must never break the response, so any
     * failure here is swallowed — the submission is still correctly rejected.
     */
    private function record(string $field, string $content, string $category, string $reason, string $detectedBy): void
    {
        try {
            ModerationLog::create([
                'user_id' => Auth::id(),
                'context' => $this->context,
                'field' => $field,
                'category' => $category,
                'reason' => $reason,
                'detected_by' => $detectedBy,
                'content' => mb_substr($content, 0, 5000),
                'ip' => Request::ip(),
            ]);
        } catch (Throwable) {
            // Ignore — never let audit logging break a request.
        }
    }
}
