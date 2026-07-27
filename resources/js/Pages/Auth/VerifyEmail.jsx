import AuthLayout, { AuthButton } from '@/Layouts/AuthLayout';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { auth } = usePage().props;
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <AuthLayout
            title="Verify Email"
            heading="Almost there!"
            intro="Confirm your email to unlock your dashboard, post tasks and chat with Taha Yassine Youssef."
            formTitle="Verify your email"
        >
            <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-violet-500">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>

                <p className="text-sm leading-relaxed text-gray-600">
                    We&apos;ve sent a verification link to
                    {auth?.user?.email ? <span className="font-semibold text-violet-600"> {auth.user.email}</span> : ' your email'}.
                    Click it to activate your account. You can&apos;t reach the dashboard until your email is verified.
                </p>

                {status === 'verification-link-sent' && (
                    <div className="mt-4 w-full rounded-xl bg-green-50 px-4 py-2.5 text-sm font-medium text-green-600">
                        A new verification link has been sent to your email.
                    </div>
                )}

                <form onSubmit={submit} className="mt-6 w-full">
                    <AuthButton type="submit" disabled={processing}>
                        {processing ? 'Sending…' : 'Resend email'}
                    </AuthButton>
                </form>

                <p className="mt-4 text-xs text-gray-500">
                    Didn&apos;t get it? Check your spam folder, or{' '}
                    <button type="button" onClick={submit} className="font-semibold text-violet-600 hover:text-violet-800">
                        resend
                    </button>
                    .
                </p>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="mt-6 text-sm text-gray-500 underline-offset-4 hover:text-gray-700 hover:underline"
                >
                    Log out
                </Link>
            </div>
        </AuthLayout>
    );
}
