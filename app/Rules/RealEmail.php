<?php

namespace App\Rules;

use App\Support\AiUserScreener;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Rejects disposable/temporary inboxes and reserved non-real domains
 * (mailinator, tempmail, *.test, example.com, …) so people register with a
 * real, permanent email. Shares its domain logic with the account scanner.
 */
class RealEmail implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || $value === '') {
            return;
        }

        if (AiUserScreener::unrealEmailReason($value) !== null) {
            $fail('Please use a real, permanent email address — temporary or test addresses are not allowed.');
        }
    }
}
