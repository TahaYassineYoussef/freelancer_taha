import PanelLayout from '@/Layouts/PanelLayout';
import { useT } from '@/i18n';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function Privacy() {
    const t = useT();
    const { auth } = usePage().props;

    const currentRef = useRef(null);
    const newRef = useRef(null);
    const [done, setDone] = useState(false);

    const { data, setData, put, processing, errors, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setDone(true);
                setTimeout(() => setDone(false), 4000);
            },
            onError: (err) => {
                if (err.password) {
                    reset('password', 'password_confirmation');
                    newRef.current?.focus();
                }
                if (err.current_password) {
                    reset('current_password');
                    currentRef.current?.focus();
                }
            },
        });
    };

    const inputClass =
        'w-full rounded-xl border border-white/10 bg-ink px-4 py-2.5 text-white placeholder-gray-500 focus:border-gold focus:ring-gold';

    return (
        <PanelLayout title="Privacy & Security">
            <Head title="Privacy" />

            <div className="mx-auto max-w-2xl space-y-6">
                {/* Account */}
                <div className="rounded-2xl border border-white/5 bg-ink-700 p-6">
                    <h2 className="text-lg font-bold text-white">{t('Account')}</h2>
                    <p className="mt-1 text-sm text-gray-400">{t('You are signed in as')}</p>
                    <p className="mt-2 font-semibold text-gold">{auth?.user?.email}</p>
                </div>

                {/* Change password */}
                <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/5 bg-ink-700 p-6">
                    <div>
                        <h2 className="text-lg font-bold text-white">{t('Change password')}</h2>
                        <p className="mt-1 text-sm text-gray-400">
                            {t('Use a long, unique password to keep your account secure.')}
                        </p>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-300">{t('Current password')}</label>
                        <input
                            ref={currentRef}
                            type="password"
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            autoComplete="current-password"
                            className={inputClass}
                            placeholder="••••••••"
                        />
                        {errors.current_password && <p className="mt-1 text-sm text-red-400">{errors.current_password}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-300">{t('New password')}</label>
                        <input
                            ref={newRef}
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="new-password"
                            className={inputClass}
                            placeholder="••••••••"
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-300">{t('Confirm new password')}</label>
                        <input
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            autoComplete="new-password"
                            className={inputClass}
                            placeholder="••••••••"
                        />
                        {errors.password_confirmation && <p className="mt-1 text-sm text-red-400">{errors.password_confirmation}</p>}
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink transition hover:bg-gold-300 disabled:opacity-50"
                        >
                            {processing ? t('Saving…') : t('Update password')}
                        </button>
                        {done && <span className="text-sm font-medium text-green-400">✓ {t('Password updated')}</span>}
                    </div>
                </form>
            </div>
        </PanelLayout>
    );
}
