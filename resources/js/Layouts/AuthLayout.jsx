import { Head, Link } from '@inertiajs/react';
import { forwardRef } from 'react';

/**
 * Shared split-screen shell for every auth screen (login, register,
 * forgot password, reset password) so they all look like one product.
 *
 * Left  = decorative purple panel with the comet streaks.
 * Right = whichever form the page passes in as children.
 */
export default function AuthLayout({ title, heading, intro, formTitle, children }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 p-4">
            <Head title={title} />

            <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                {/* Left decorative panel */}
                <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 p-12 md:flex md:flex-col md:justify-center">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute -bottom-10 left-4 h-8 w-72 -rotate-45 rounded-full bg-gradient-to-r from-orange-500 to-amber-300 opacity-90 blur-[1px]" />
                        <div className="absolute bottom-6 left-0 h-5 w-56 -rotate-45 rounded-full bg-gradient-to-r from-orange-400 to-yellow-300 opacity-80" />
                        <div className="absolute bottom-24 left-10 h-3 w-40 -rotate-45 rounded-full bg-gradient-to-r from-pink-400 to-amber-200 opacity-70 blur-[1px]" />
                        <div className="absolute -bottom-4 left-32 h-10 w-96 -rotate-45 rounded-full bg-gradient-to-r from-rose-500 to-orange-300 opacity-60 blur-sm" />
                        <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/10 blur-2xl" />
                    </div>

                    <div className="relative z-10">
                        <h1 className="text-4xl font-black leading-tight text-white lg:text-5xl">{heading}</h1>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-indigo-100">{intro}</p>
                        <Link
                            href={route('home')}
                            className="mt-8 inline-block text-sm font-semibold text-white/90 underline-offset-4 hover:underline"
                        >
                            ← Back to home
                        </Link>
                    </div>
                </div>

                {/* Right form panel */}
                <div className="w-full p-8 sm:p-12 md:w-1/2">
                    <h2 className="mb-6 text-center text-xl font-bold uppercase tracking-[0.2em] text-violet-600">
                        {formTitle}
                    </h2>
                    {children}
                </div>
            </div>
        </div>
    );
}

/**
 * Rounded input with a leading icon — shared by every auth form.
 * forwardRef so pages can read the real DOM value (browser autofill).
 */
export const AuthInput = forwardRef(function AuthInput({ icon, error, ...props }, ref) {
    return (
        <div>
            <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-violet-400">
                    {icon}
                </span>
                <input
                    ref={ref}
                    {...props}
                    className={`w-full rounded-full border-0 bg-indigo-50 py-3 pl-12 pr-4 text-sm text-gray-700 placeholder-violet-400 focus:bg-indigo-50 focus:ring-2 ${
                        error ? 'ring-2 ring-red-400 focus:ring-red-400' : 'focus:ring-violet-400'
                    }`}
                />
            </div>
            {error && <p className="mt-1.5 pl-4 text-sm text-red-500">{error}</p>}
        </div>
    );
});

/** Gradient pill submit button — shared by every auth form. */
export function AuthButton({ children, ...props }) {
    return (
        <div className="pt-2 text-center">
            <button
                {...props}
                className="rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-12 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-violet-500/30 transition hover:opacity-90 disabled:opacity-60"
            >
                {children}
            </button>
        </div>
    );
}

export const Icons = {
    user: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    mail: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    lock: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    ),
};
