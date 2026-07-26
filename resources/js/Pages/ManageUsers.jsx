import PanelLayout from '@/Layouts/PanelLayout';
import LineChart from '@/Components/LineChart';
import { useT } from '@/i18n';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

// Registrations are bucketed by day / month / year on the server.
const GRAINS = [
    { key: 'daily', label: 'Daily' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
];

function StatCard({ label, value, accent }) {
    return (
        <div className="rounded-2xl border border-white/5 bg-ink-700 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
            <p className={`mt-2 text-3xl font-black ${accent || 'text-white'}`}>{value}</p>
        </div>
    );
}

function RoleBadge({ role }) {
    const freelancer = role === 'freelancer';
    return (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${freelancer ? 'bg-gold/15 text-gold' : 'bg-white/10 text-gray-200'}`}>
            {role}
        </span>
    );
}

// Laravel paginator labels arrive as HTML ("&laquo; Previous", "…"); clean them.
function decodeLabel(label) {
    return label
        .replace('&laquo;', '«')
        .replace('&raquo;', '»')
        .replace(/&hellip;/g, '…')
        .replace(/<[^>]*>/g, '')
        .trim();
}

function Pagination({ meta }) {
    const t = useT();
    if (!meta.links || meta.last_page <= 1) return null;
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-4 py-3">
            <p className="text-xs text-gray-500">
                {t('Showing')} {meta.from ?? 0}–{meta.to ?? 0} {t('of')} {meta.total}
            </p>
            <div className="flex flex-wrap gap-1">
                {meta.links.map((link, i) => {
                    const label = decodeLabel(link.label);
                    const base = 'min-w-9 rounded-lg px-3 py-1.5 text-center text-sm font-medium transition';
                    if (!link.url) {
                        return <span key={i} className={`${base} cursor-default text-gray-600`}>{label}</span>;
                    }
                    return (
                        <Link
                            key={i}
                            href={link.url}
                            preserveScroll
                            preserveState
                            className={`${base} ${link.active ? 'bg-gold text-ink' : 'text-gray-300 hover:bg-white/10'}`}
                        >
                            {label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

export default function ManageUsers({ stats, chart, users, filters }) {
    const t = useT();
    const [search, setSearch] = useState(filters.search || '');
    const firstRun = useRef(true);

    // Debounced search → server (keeps the table + pagination in sync).
    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }
        const id = setTimeout(() => {
            router.get(
                route('users.index'),
                { search: search || undefined, role: filters.role || undefined },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 350);
        return () => clearTimeout(id);
    }, [search]);

    const setRole = (role) => {
        router.get(
            route('users.index'),
            { search: search || undefined, role: role || undefined },
            { preserveState: true, preserveScroll: true },
        );
    };

    const roles = [
        { key: null, label: 'All' },
        { key: 'client', label: 'Clients' },
        { key: 'freelancer', label: 'Freelancers' },
    ];

    return (
        <PanelLayout title="Manage Users">
            <Head title="Manage Users" />

            {/* Headline counts */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label={t('Total users')} value={stats.total} accent="text-gold" />
                <StatCard label={t('Clients')} value={stats.clients} />
                <StatCard label={t('Freelancers')} value={stats.freelancers} />
                <StatCard label={t('New today')} value={stats.today} />
                <StatCard label={t('This month')} value={stats.month} />
                <StatCard label={t('This year')} value={stats.year} />
            </div>

            {/* Registrations over time */}
            <div className="mt-6">
                <LineChart
                    title="Registrations"
                    series={chart}
                    grains={GRAINS}
                    unit="users"
                    defaultGrain="monthly"
                    emptyMessage="No sign-ups in this period yet."
                />
            </div>

            {/* Accounts */}
            <div className="mt-6 rounded-2xl border border-white/5 bg-ink-700">
                <div className="flex flex-col gap-3 border-b border-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-bold text-white">
                        {t('Accounts')} <span className="text-sm font-normal text-gray-500">({users.total})</span>
                    </h2>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex rounded-full bg-ink p-1 text-xs">
                            {roles.map((r) => (
                                <button
                                    key={r.label}
                                    onClick={() => setRole(r.key)}
                                    className={`rounded-full px-3 py-1 font-medium transition ${
                                        (filters.role ?? null) === r.key ? 'bg-gold text-ink' : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {t(r.label)}
                                </button>
                            ))}
                        </div>
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('Search name or email…')}
                            className="rounded-full border border-white/10 bg-ink px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-gold focus:ring-gold"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs uppercase tracking-wide text-gray-500">
                            <tr className="border-b border-white/5">
                                <th className="px-4 py-3 font-semibold">{t('Name')}</th>
                                <th className="px-4 py-3 font-semibold">{t('Email')}</th>
                                <th className="px-4 py-3 font-semibold">{t('Role')}</th>
                                <th className="px-4 py-3 font-semibold">{t('Status')}</th>
                                <th className="px-4 py-3 font-semibold">{t('Joined')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">{t('No users found.')}</td>
                                </tr>
                            )}
                            {users.data.map((u) => (
                                <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                    <td className="px-4 py-3 font-semibold text-white">{u.name}</td>
                                    <td className="px-4 py-3 text-gray-300">{u.email}</td>
                                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${u.verified ? 'bg-green-500/15 text-green-300' : 'bg-white/10 text-gray-400'}`}>
                                                {u.verified ? t('Verified') : t('Unverified')}
                                            </span>
                                            {u.google && (
                                                <span className="inline-flex rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-300">Google</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400" title={u.joined}>{u.joined_human}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination meta={users} />
            </div>
        </PanelLayout>
    );
}
