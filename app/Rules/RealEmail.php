<?php

namespace App\Rules;

use App\Support\AiUserScreener;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\App;

/**
 * Rejects fake emails at two levels:
 *  1. Disposable/temporary inboxes and reserved non-real domains (mailinator,
 *     tempmail, *.test, example.com, …) — shared with the account scanner.
 *  2. Domains that cannot actually receive mail — verified with a live DNS
 *     MX-record lookup. This catches made-up or mistyped domains (e.g.
 *     "gmial.con") that no static list could know about.
 *
 * (There is no "Google/Yahoo AI" for email verification — MX lookup is the
 * real, free way to tell whether an address's domain can receive mail. Proving
 * a specific inbox exists needs a verification email or a paid API.)
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

            return;
        }

        $domain = str_contains($value, '@') ? substr(strrchr($value, '@'), 1) : '';

        // Live MX check (skipped under tests to stay deterministic/offline).
        if ($domain !== '' && ! App::environment('testing') && ! $this->domainReceivesMail($domain)) {
            $fail('That email domain can’t receive mail. Please enter a real email address.');
        }
    }

    /**
     * True if the domain has a mail server (MX), or at least an A/AAAA record
     * (RFC 5321 implicit MX). Fails open on any DNS error so a transient lookup
     * failure never blocks a genuine sign-up.
     */
    private function domainReceivesMail(string $domain): bool
    {
        try {
            $domain = rtrim($domain, '.');

            return checkdnsrr($domain, 'MX')
                || checkdnsrr($domain, 'A')
                || checkdnsrr($domain, 'AAAA');
        } catch (\Throwable) {
            return true;
        }
    }
}
