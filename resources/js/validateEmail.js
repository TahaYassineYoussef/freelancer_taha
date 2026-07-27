// Client-side email check for the auth forms — mirrors the server-side
// RealEmail rule (App\Rules\RealEmail / AiUserScreener) so the inline hint
// matches what registration actually enforces. This is UX only; the server
// remains the source of truth.

const DISPOSABLE = new Set([
    'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com',
    '10minutemail.com', '10minutemail.net', 'tempmail.com', 'temp-mail.org',
    'tempmailo.com', 'tempmail.plus', 'throwawaymail.com', 'yopmail.com', 'yopmail.fr',
    'trashmail.com', 'getnada.com', 'nada.email', 'dispostable.com', 'maildrop.cc',
    'mailnesia.com', 'mohmal.com', 'fakeinbox.com', 'spam4.me', 'grr.la', 'emltmp.com',
    'moakt.com', 'mailcatch.com', 'tempinbox.com', 'mintemail.com', 'mailtemp.net',
    'inboxkitten.com', 'burnermail.io', 'temp-mail.io', '1secmail.com', '1secmail.net',
    'discard.email', 'wegwerfmail.de', 'mailexpire.com', 'tmpmail.net', 'emailondeck.com',
    'anonaddy.me', 'byom.de', 'mail-temp.com', 'tempr.email', 'luxusmail.org',
]);

const EXAMPLE_DOMAINS = new Set(['example.com', 'example.org', 'example.net']);
const RESERVED_TLD = /\.(test|example|invalid|localhost|local)$/;
// Deliberately simple, forgiving format check (like the browser's own).
const FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Returns an inline error message for a bad/fake email, or '' when it's fine
 * (or empty — "required" is handled at submit).
 */
export function emailError(email) {
    const value = (email || '').trim().toLowerCase();
    if (value === '') return '';

    if (!FORMAT.test(value)) return 'Please enter a valid email.';

    const domain = value.split('@')[1] || '';
    if (DISPOSABLE.has(domain) || EXAMPLE_DOMAINS.has(domain) || RESERVED_TLD.test(domain)) {
        return 'Please use a real, permanent email address.';
    }

    return '';
}
