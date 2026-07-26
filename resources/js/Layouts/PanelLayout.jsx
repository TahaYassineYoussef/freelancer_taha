import CallProvider from '@/CallProvider';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import NotificationBell from '@/Components/NotificationBell';
import Photo from '@/Components/Photo';
import { useApplyDirection, useT } from '@/i18n';
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

// Solid (filled) icon set — matches the reference icon style.
const ICONS = {
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    grid: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
    chat: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
    cash: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z',
    wallet: 'M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
    mail: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    shield: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
    doc: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
    revise: 'M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z',
    delivery: 'M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z',
    star: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    list: 'M3 5h2v2H3V5zm0 6h2v2H3v-2zm0 6h2v2H3v-2zM7 5h14v2H7V5zm0 6h14v2H7v-2zm0 6h14v2H7v-2z',
    calendar: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z',
    clock: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
    chart: 'M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z',
    users: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
};

function NavIcon({ d }) {
    return (
        <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d={d} />
        </svg>
    );
}

function NavItem({ href, icon, active, badge, children, onClick }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                active
                    ? 'bg-gold/15 text-gold'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
        >
            {active && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-gold" />}
            <NavIcon d={icon} />
            <span className="flex-1">{children}</span>
            {badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {badge}
                </span>
            )}
        </Link>
    );
}

export default function PanelLayout({ title, children }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const unread = auth?.unreadMessages ?? 0;
    const pendingRevisions = auth?.pendingRevisions ?? 0;
    const pendingDeliveries = auth?.pendingDeliveries ?? 0;
    const pendingBookings = auth?.pendingBookings ?? 0;
    const newTasks = auth?.newTasks ?? 0;
    const current = route().current();
    const isFreelancer = user?.role === 'freelancer';
    const [open, setOpen] = useState(false);

    const close = () => setOpen(false);
    const t = useT();

    useApplyDirection();

    // Keep the whole dashboard live: silently refresh the current page's data
    // and the shared notifications/badges every few seconds — no manual reload.
    // preserveState/Scroll keeps your place, open modals, chat and calls intact.
    // We skip while another Inertia request is in flight (so it never interrupts
    // a click) and while the tab is hidden.
    const busyRef = useRef(false);
    useEffect(() => {
        if (!user) return; // logged out — nothing to refresh

        const offStart = router.on('start', () => { busyRef.current = true; });
        const offFinish = router.on('finish', () => { busyRef.current = false; });

        const id = setInterval(() => {
            if (document.hidden || busyRef.current) return;
            router.reload({ preserveState: true, preserveScroll: true });
        }, 7000);

        // If the session or role changes mid-refresh (e.g. you log out, or switch
        // to a client account while sitting on a freelancer-only page), the server
        // answers 401/403/419. Without this, Inertia would splash that raw error
        // full-screen. Send the user to the login page instead.
        const offInvalid = router.on('invalid', (event) => {
            const status = event.detail.response?.status;
            if ([401, 403, 419].includes(status)) {
                event.preventDefault();
                clearInterval(id);
                window.location.href = route('login');
            }
        });

        return () => { clearInterval(id); offStart(); offFinish(); offInvalid(); };
    }, [user?.id]);

    const nav = (
        <nav className="space-y-1">
            <NavItem href={route('home')} icon={ICONS.home} onClick={close}>{t('Home')}</NavItem>
            <NavItem href={route('dashboard')} icon={ICONS.grid} active={current === 'dashboard'} onClick={close}>{t('Dashboard')}</NavItem>
            <NavItem href={route('chat.index')} icon={ICONS.chat} active={current?.startsWith('chat')} badge={unread} onClick={close}>{t('Chat')}</NavItem>
            {!isFreelancer && (
                <>
                    <NavItem href={route('mytasks.index')} icon={ICONS.list} active={current?.startsWith('mytasks')} onClick={close}>{t('My Tasks')}</NavItem>
                    <NavItem href={route('deliveries.index')} icon={ICONS.delivery} active={current?.startsWith('deliveries')} badge={pendingDeliveries} onClick={close}>{t('Deliveries')}</NavItem>
                    <NavItem href={route('booking.index')} icon={ICONS.calendar} active={current?.startsWith('booking')} onClick={close}>{t('Book a Call')}</NavItem>
                </>
            )}
            {isFreelancer && (
                <>
                    <NavItem href={route('visitors.index')} icon={ICONS.chart} active={current?.startsWith('visitors')} onClick={close}>{t('Visitors')}</NavItem>
                    <NavItem href={route('users.index')} icon={ICONS.users} active={current?.startsWith('users')} onClick={close}>{t('Manage Users')}</NavItem>
                    <NavItem href={route('payments.index')} icon={ICONS.cash} active={current?.startsWith('payments')} onClick={close}>{t('Payments')}</NavItem>
                    <NavItem href={route('tasks.index')} icon={ICONS.list} active={current?.startsWith('tasks')} badge={newTasks} onClick={close}>{t('Tasks')}</NavItem>
                    <NavItem href={route('work.index')} icon={ICONS.delivery} active={current?.startsWith('work')} onClick={close}>{t('Deliveries')}</NavItem>
                    <NavItem href={route('reviews.index')} icon={ICONS.star} active={current?.startsWith('reviews')} onClick={close}>{t('Reviews')}</NavItem>
                    <NavItem href={route('payment.settings')} icon={ICONS.wallet} active={current?.startsWith('payment.settings')} onClick={close}>{t('Get Paid')}</NavItem>
                    <NavItem href={route('revisions.index')} icon={ICONS.revise} active={current?.startsWith('revisions')} badge={pendingRevisions} onClick={close}>{t('Revisions')}</NavItem>
                    <NavItem href={route('bookings.index')} icon={ICONS.calendar} active={current === 'bookings.index'} badge={pendingBookings} onClick={close}>{t('Bookings')}</NavItem>
                    <NavItem href={route('availability.edit')} icon={ICONS.clock} active={current?.startsWith('availability')} onClick={close}>{t('Availability')}</NavItem>
                    <NavItem href={route('contact.index')} icon={ICONS.mail} active={current?.startsWith('contact')} onClick={close}>{t('Inbox')}</NavItem>
                    <NavItem href={route('moderation.index')} icon={ICONS.shield} active={current?.startsWith('moderation')} onClick={close}>{t('Blocked')}</NavItem>
                    <NavItem href={route('cv.edit')} icon={ICONS.doc} active={current?.startsWith('cv')} onClick={close}>{t('Manage CV')}</NavItem>
                </>
            )}
        </nav>
    );

    return (
        <CallProvider>
        <div className="min-h-screen bg-ink text-white lg:flex">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-white/5 bg-ink-800 transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex h-full flex-col p-4">
                    <Link href={route('home')} className="mb-8 px-2 pt-2 text-xl font-black tracking-widest text-white">
                        TAHA<span className="text-gold">.</span>
                    </Link>
                    {nav}
                    <div className="mt-auto border-t border-white/5 pt-4">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
                        >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                            </svg>
                            {t('Logout')}
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Backdrop on mobile */}
            {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={close} />}

            {/* Main column */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Top bar */}
                <header className="sticky top-0 z-20 border-b border-white/5 bg-ink/80 backdrop-blur">
                    <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-gray-300 hover:bg-white/5 lg:hidden" aria-label="Open menu">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-lg font-black text-white sm:text-xl">{t('Hi')} {t(user?.name?.split(' ')[0] || '')}</h1>
                                <p className="text-xs text-gray-400">{t(title)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <LanguageSwitcher />
                            <NotificationBell />
                            <div className="flex items-center gap-2">
                                <Photo
                                    src={isFreelancer ? ['/images/taha.png', '/images/taha.jpg'] : null}
                                    name={user?.name ?? '?'}
                                    rounded="rounded-full"
                                    className="h-9 w-9"
                                />
                                <span className="hidden text-sm font-semibold text-white sm:block">{t(user?.name || '')}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 px-5 py-6 sm:px-8">{children}</main>
            </div>
        </div>
        </CallProvider>
    );
}
