import AuthLayout, { AuthButton, AuthInput, Icons } from '@/Layouts/AuthLayout';
import { emailError } from '@/validateEmail';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Register() {
    const { googleEnabled } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    // Live "fake email" detection: show the hint once the field is touched.
    const [emailTouched, setEmailTouched] = useState(false);
    const liveEmailError = emailTouched ? emailError(data.email) : '';

    const submit = (e) => {
        e.preventDefault();
        // Block obviously fake/invalid emails before the round-trip.
        if (emailError(data.email)) {
            setEmailTouched(true);
            return;
        }
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title="Register"
            heading="Join as a client"
            intro="Create an account to post your tasks, chat with Taha Yassine Youssef directly, and follow your projects from one dashboard."
            formTitle="Create Account"
        >
            {googleEnabled && (
                <>
                    <a
                        href={route('google.redirect')}
                        className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                            <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.15 6.16-4.15z" />
                        </svg>
                        Sign up with Google
                    </a>

                    <div className="my-5 flex items-center gap-3">
                        <span className="h-px flex-1 bg-gray-200" />
                        <span className="text-xs uppercase tracking-wide text-gray-400">or</span>
                        <span className="h-px flex-1 bg-gray-200" />
                    </div>
                </>
            )}

            <form onSubmit={submit} className="space-y-4">
                <AuthInput
                    icon={Icons.user}
                    error={errors.name}
                    id="name"
                    type="text"
                    name="name"
                    value={data.name}
                    autoComplete="name"
                    autoFocus
                    placeholder="Full name"
                    onChange={(e) => setData('name', e.target.value)}
                />

                <AuthInput
                    icon={Icons.mail}
                    error={errors.email || liveEmailError}
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    autoComplete="username"
                    placeholder="Email"
                    onChange={(e) => { setData('email', e.target.value); if (emailTouched) setEmailTouched(true); }}
                    onBlur={() => setEmailTouched(true)}
                />

                <AuthInput
                    icon={Icons.lock}
                    error={errors.password}
                    id="password"
                    type="password"
                    name="password"
                    value={data.password}
                    autoComplete="new-password"
                    placeholder="Password"
                    onChange={(e) => setData('password', e.target.value)}
                />

                <AuthInput
                    icon={Icons.lock}
                    error={errors.password_confirmation}
                    id="password_confirmation"
                    type="password"
                    name="password_confirmation"
                    value={data.password_confirmation}
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                />

                <AuthButton type="submit" disabled={processing}>
                    {processing ? 'Creating…' : 'Sign up'}
                </AuthButton>

                <p className="pt-2 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href={route('login')} className="font-semibold text-violet-600 hover:text-violet-800">
                        Log in
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
