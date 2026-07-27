import Photo from '@/Components/Photo';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { useApplyDirection, useT } from '@/i18n';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const PHOTO = ['/images/taha.png', '/images/taha.jpg'];

const NAV = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Skills', href: '#skills' },
    { label: 'Services', href: '#services' },
    { label: 'Projects', href: '#projects' },
    { label: 'Resume', href: '#resume' },
    { label: 'Reviews', href: '#testimonials' },
    { label: 'Post a Task', href: '#tasks' },
    { label: 'Contact', href: '#contact' },
];

// Photo sources: uploaded avatar first, then static files, then initials fallback.
function photoSources(freelancer) {
    return [freelancer?.avatar_url, '/images/taha.png', '/images/taha.jpg'].filter(Boolean);
}

function fmtDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function range(start, end, current) {
    const from = fmtDate(start) ?? (typeof start === 'number' ? start : null);
    const to = current ? 'Present' : (fmtDate(end) ?? (typeof end === 'number' ? end : null));
    if (!from && !to) return '';
    return [from, to].filter(Boolean).join(' — ');
}

function Navbar({ user }) {
    const [open, setOpen] = useState(false);
    const t = useT();

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-ink/80 backdrop-blur">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <a href="#home" className="text-xl font-black tracking-widest text-white">
                    TAHA<span className="text-gold">.</span>
                </a>

                <div className="hidden items-center gap-7 md:flex">
                    {NAV.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-gray-300 transition hover:text-gold"
                        >
                            {t(item.label)}
                        </a>
                    ))}
                    {user ? (
                        <Link
                            href={route('dashboard')}
                            className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-300"
                        >
                            {t('Dashboard')}
                        </Link>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link href={route('login')} className="text-sm font-medium text-gray-300 hover:text-gold">
                                {t('Login')}
                            </Link>
                            <Link
                                href={route('register')}
                                className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-300"
                            >
                                {t('Sign up')}
                            </Link>
                        </div>
                    )}
                    <LanguageSwitcher />
                </div>

                <button
                    onClick={() => setOpen((o) => !o)}
                    className="text-gray-200 md:hidden"
                    aria-label="Toggle menu"
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </nav>

            {open && (
                <div className="border-t border-white/5 bg-ink px-6 pb-4 md:hidden">
                    {NAV.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className="block py-2 text-sm text-gray-300 hover:text-gold"
                        >
                            {t(item.label)}
                        </a>
                    ))}
                    <div className="mt-2 flex items-center gap-3">
                        {user ? (
                            <Link href={route('dashboard')} className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink">
                                {t('Dashboard')}
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')} className="rounded-full border border-white/20 px-4 py-2 text-sm text-white">
                                    {t('Login')}
                                </Link>
                                <Link href={route('register')} className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink">
                                    {t('Sign up')}
                                </Link>
                            </>
                        )}
                        <LanguageSwitcher />
                    </div>
                </div>
            )}
        </header>
    );
}

function SectionTitle({ children, ghost }) {
    const t = useT();
    const content = typeof children === 'string' ? t(children) : children;
    return (
        <div className="relative mb-10">
            <h2 className="relative z-10 text-3xl font-extrabold text-white sm:text-4xl">{content}</h2>
            {ghost && (
                <span className="pointer-events-none absolute -bottom-4 left-0 select-none text-5xl font-black text-white/5 sm:text-6xl">
                    {ghost}
                </span>
            )}
            <div className="mt-4 h-1 w-14 rounded bg-gold" />
        </div>
    );
}

function Hero({ freelancer, user }) {
    const t = useT();
    return (
        <section id="home" className="relative overflow-hidden pt-28">
            <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
                <div>
                    <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-gold">{t('Hello!')}</p>
                    <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                        {t("I'm")} <span className="text-gold">{t('Taha Yassine')}</span>
                        <br />
                        {t('Youssef')}
                    </h1>
                    <p className="mt-5 text-lg text-gray-300">
                        {freelancer?.headline || t('Freelance Full-Stack Developer')}
                    </p>

                    <div className="mt-8 flex flex-wrap gap-4">
                        <a
                            href="#tasks"
                            className="rounded-full bg-gold px-7 py-3 text-sm font-bold uppercase tracking-wide text-ink shadow-lg shadow-gold/20 transition hover:bg-gold-300"
                        >
                            {t('Hire Me')}
                        </a>
                        <a
                            href="#projects"
                            className="rounded-full border border-white/20 px-7 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:border-gold hover:text-gold"
                        >
                            {t('My Works')}
                        </a>
                        <a
                            href={route('cv.download')}
                            className="flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:border-gold hover:text-gold"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                            </svg>
                            {t('Download CV')}
                        </a>
                    </div>
                </div>

                <div className="relative mx-auto w-full max-w-md">
                    {/* Soft glow */}
                    <div className="absolute -inset-6 z-0 rounded-full bg-gold/25 blur-3xl" />
                    {/* Solid gold backdrop that shows behind the transparent PNG */}
                    <div className="absolute inset-0 z-0 rounded-[2.5rem] bg-gradient-to-b from-gold to-gold-600" />
                    <Photo
                        src={photoSources(freelancer)}
                        name="Taha Yassine Youssef"
                        rounded="rounded-[2.5rem]"
                        className="relative z-10 aspect-[4/5] w-full"
                    />
                </div>
            </div>
        </section>
    );
}

function About({ freelancer, user }) {
    const t = useT();
    return (
        <section id="about" className="border-t border-white/5 py-20">
            <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[280px_1fr] md:items-start">
                <Photo
                    src={photoSources(freelancer)}
                    name="Taha Yassine Youssef"
                    rounded="rounded-2xl"
                    className="aspect-square w-full max-w-[280px] shadow-xl"
                />
                <div>
                    <SectionTitle ghost="About">About Me</SectionTitle>
                    <p className="max-w-2xl text-gray-300">{freelancer?.bio}</p>

                    <dl className="mt-8 grid max-w-xl grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                        <Detail label="Name" value={freelancer?.name} />
                        <Detail label="Email" value={freelancer?.email} />
                        <Detail label="Location" value={freelancer?.location} />
                        <Detail label="Phone" value={freelancer?.phone} />
                    </dl>

                    <div className="mt-8 flex flex-wrap gap-4">
                        <a href="#contact" className="rounded-full bg-gold px-6 py-3 text-sm font-bold uppercase text-ink transition hover:bg-gold-300">
                            {t('Chat with me')}
                        </a>
                        <a href="#resume" className="rounded-full border border-white/20 px-6 py-3 text-sm font-bold uppercase text-white transition hover:border-gold hover:text-gold">
                            {t('My Resume')}
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Detail({ label, value }) {
    const t = useT();
    if (!value) return null;
    return (
        <div className="flex gap-2 border-b border-white/5 py-2">
            <dt className="font-semibold text-white">{t(label)}:</dt>
            <dd className="text-gray-400">{value}</dd>
        </div>
    );
}

function Card({ title, subtitle, meta, children }) {
    return (
        <div className="rounded-2xl border border-white/5 bg-ink-700 p-6 transition hover:border-gold/40">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <p className="mt-0.5 font-medium text-gold">{subtitle}</p>
                </div>
                {meta && (
                    <span className="whitespace-nowrap rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
                        {meta}
                    </span>
                )}
            </div>
            {children && <p className="mt-3 text-sm text-gray-400">{children}</p>}
        </div>
    );
}

function Resume({ diplomas }) {
    return (
        <section id="resume" className="border-t border-white/5 py-20">
            <div className="mx-auto max-w-6xl px-6">
                <SectionTitle ghost="Diplomas">Education &amp; Diplomas</SectionTitle>
                <div className="grid gap-5 md:grid-cols-2">
                    {diplomas?.length ? (
                        diplomas.map((d) => (
                            <Card
                                key={d.id}
                                title={d.title}
                                subtitle={d.institution}
                                meta={range(d.start_year, d.end_year)}
                            >
                                {d.field ? `${d.field}. ` : ''}
                                {d.description}
                            </Card>
                        ))
                    ) : (
                        <p className="text-gray-500">No diplomas added yet.</p>
                    )}
                </div>
            </div>
        </section>
    );
}

function Experience({ experiences }) {
    return (
        <section id="experience" className="border-t border-white/5 py-20">
            <div className="mx-auto max-w-6xl px-6">
                <SectionTitle ghost="Work">Work Experience</SectionTitle>
                <div className="grid gap-5 md:grid-cols-2">
                    {experiences?.length ? (
                        experiences.map((e) => (
                            <Card
                                key={e.id}
                                title={e.position}
                                subtitle={e.company}
                                meta={range(e.start_date, e.end_date, e.is_current)}
                            >
                                {e.location ? `${e.location}. ` : ''}
                                {e.description}
                            </Card>
                        ))
                    ) : (
                        <p className="text-gray-500">No experience added yet.</p>
                    )}
                </div>
            </div>
        </section>
    );
}

function Internships({ internships }) {
    return (
        <section id="internships" className="border-t border-white/5 py-20">
            <div className="mx-auto max-w-6xl px-6">
                <SectionTitle ghost="Intern">Internships</SectionTitle>
                <div className="grid gap-5 md:grid-cols-2">
                    {internships?.length ? (
                        internships.map((i) => (
                            <Card
                                key={i.id}
                                title={i.position}
                                subtitle={i.company}
                                meta={range(i.start_date, i.end_date)}
                            >
                                {i.location ? `${i.location}. ` : ''}
                                {i.description}
                            </Card>
                        ))
                    ) : (
                        <p className="text-gray-500">No internships added yet.</p>
                    )}
                </div>
            </div>
        </section>
    );
}

function Skills({ skills }) {
    if (!skills?.length) return null;
    return (
        <section id="skills" className="border-t border-white/5 py-20">
            <div className="mx-auto max-w-6xl px-6">
                <SectionTitle ghost="Skills">My Skills</SectionTitle>
                <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
                    {skills.map((s) => (
                        <div key={s.id}>
                            <div className="mb-1 flex justify-between text-sm">
                                <span className="font-medium text-white">{s.name}</span>
                                <span className="text-gold">{s.level}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                <div className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600" style={{ width: `${s.level}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Services({ services }) {
    if (!services?.length) return null;
    return (
        <section id="services" className="border-t border-white/5 bg-ink-800 py-20">
            <div className="mx-auto max-w-6xl px-6">
                <SectionTitle ghost="Services">What I Do</SectionTitle>
                <div className="grid gap-5 md:grid-cols-3">
                    {services.map((s) => (
                        <div key={s.id} className="rounded-2xl border border-white/5 bg-ink-700 p-6 transition hover:border-gold/40">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-2xl">
                                {s.icon || '⚡'}
                            </div>
                            <h3 className="text-lg font-bold text-white">{s.title}</h3>
                            {s.description && <p className="mt-2 text-sm text-gray-400">{s.description}</p>}
                            {s.price && <p className="mt-4 font-semibold text-gold">From ${s.price}</p>}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Extracts a YouTube video ID from common URL formats.
function youtubeId(url) {
    if (!url) return null;
    const m = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    return m ? m[1] : null;
}

function youtubeThumbnail(url) {
    const id = youtubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

/** Project media: uploaded video, uploaded image, or an inline YouTube player. */
function ProjectMedia({ project }) {
    const [playing, setPlaying] = useState(false);
    const ytId = youtubeId(project.live_url);

    if (project.video_url) {
        return (
            <video src={project.video_url} controls poster={project.image_url ?? undefined} className="h-full w-full object-cover" />
        );
    }

    // Play the YouTube video right inside the card instead of leaving the site.
    if (ytId && playing) {
        return (
            <iframe
                src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`}
                title={project.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
            />
        );
    }

    if (project.image_url) {
        return <img src={project.image_url} alt={project.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />;
    }

    if (ytId) {
        return (
            <button type="button" onClick={() => setPlaying(true)} className="group/yt relative block h-full w-full" aria-label={`Play ${project.title}`}>
                <img src={youtubeThumbnail(project.live_url)} alt={project.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white ring-2 ring-white/70 transition group-hover/yt:scale-110 group-hover/yt:bg-red-600">
                        <svg className="ml-1 h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                </span>
            </button>
        );
    }

    return <div className="flex h-full items-center justify-center text-4xl text-white/10">{'</>'}</div>;
}

function Projects({ projects }) {
    return (
        <section id="projects" className="border-t border-white/5 py-20">
            <div className="mx-auto max-w-6xl px-6">
                <SectionTitle ghost="Works">My Projects</SectionTitle>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects?.length ? (
                        projects.map((p) => (
                            <div key={p.id} className="group overflow-hidden rounded-2xl border border-white/5 bg-ink-700 transition hover:border-gold/40">
                                <div className="relative aspect-video w-full overflow-hidden bg-ink">
                                    <ProjectMedia project={p} />
                                </div>
                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-white">{p.title}</h3>
                                    {p.tech_stack && <p className="mt-1 text-xs font-medium text-gold">{p.tech_stack}</p>}
                                    {p.description && <p className="mt-2 line-clamp-3 text-sm text-gray-400">{p.description}</p>}
                                    {youtubeId(p.live_url) && (
                                        <a
                                            href={p.live_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-3 flex items-center gap-2 break-all text-xs text-gray-500 transition hover:text-red-400"
                                            title="Open on YouTube"
                                        >
                                            <svg className="h-4 w-4 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
                                            </svg>
                                            {p.live_url}
                                        </a>
                                    )}
                                    <div className="mt-4 flex gap-4 text-sm">
                                        {p.live_url && (
                                            <a href={p.live_url} target="_blank" rel="noreferrer" className="font-semibold text-gold hover:text-gold-300">
                                                {youtubeId(p.live_url) ? 'Watch on YouTube ↗' : 'Live ↗'}
                                            </a>
                                        )}
                                        {p.github_url && (
                                            <a href={p.github_url} target="_blank" rel="noreferrer" className="font-semibold text-gray-300 hover:text-white">
                                                GitHub ↗
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No projects added yet.</p>
                    )}
                </div>
            </div>
        </section>
    );
}

function TaskSection({ user }) {
    const t = useT();
    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm({
        title: '',
        description: '',
        category: '',
        budget: '',
        deadline: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('tasks.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const isClient = user && user.role === 'client';

    return (
        <section id="tasks" className="border-t border-white/5 bg-ink-800 py-20">
            <div className="mx-auto max-w-3xl px-6">
                <SectionTitle ghost="Hire">Post a Task</SectionTitle>
                <p className="mb-8 max-w-xl text-gray-300">
                    {t('Have a project in mind? Post the details below and Taha will get back to you.')}
                </p>

                {!user && (
                    <div className="rounded-2xl border border-gold/30 bg-gold/5 p-6 text-gray-200">
                        {t('Please')}{' '}
                        <Link href={route('login')} className="font-semibold text-gold underline">
                            {t('log in')}
                        </Link>{' '}
                        {t('or')}{' '}
                        <Link href={route('register')} className="font-semibold text-gold underline">
                            {t('create an account')}
                        </Link>{' '}
                        {t('to post a task and chat with Taha.')}
                    </div>
                )}

                {user && !isClient && (
                    <div className="rounded-2xl border border-white/10 bg-ink-700 p-6 text-gray-300">
                        {t('You are signed in as the freelancer. View incoming tasks in your')}{' '}
                        <Link href={route('dashboard')} className="font-semibold text-gold underline">
                            {t('dashboard')}
                        </Link>
                        .
                    </div>
                )}

                {isClient && (
                    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-white/5 bg-ink-700 p-6">
                        {wasSuccessful && (
                            <p className="rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-400">
                                {t('Your task has been posted successfully!')}
                            </p>
                        )}
                        <Field label={t('Title')} error={errors.title}>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                className={inputCls}
                                placeholder={t('e.g. Build a company landing page')}
                            />
                        </Field>
                        <Field label={t('Description')} error={errors.description}>
                            <textarea
                                rows={4}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className={inputCls}
                                placeholder={t('Describe what you need…')}
                            />
                        </Field>
                        <div className="grid gap-5 sm:grid-cols-3">
                            <Field label={t('Category')} error={errors.category}>
                                <input
                                    type="text"
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    className={inputCls}
                                    placeholder={t('Web Dev')}
                                />
                            </Field>
                            <Field label={t('Budget ($)')} error={errors.budget}>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.budget}
                                    onChange={(e) => setData('budget', e.target.value)}
                                    className={inputCls}
                                    placeholder="500"
                                />
                            </Field>
                            <Field label={t('Deadline')} error={errors.deadline}>
                                <input
                                    type="date"
                                    value={data.deadline}
                                    min={new Date().toISOString().slice(0, 10)}
                                    onChange={(e) => setData('deadline', e.target.value)}
                                    className={inputCls}
                                />
                            </Field>
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-gold px-8 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-gold-300 disabled:opacity-60"
                        >
                            {processing ? t('Posting…') : t('Post Task')}
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
}

const inputCls =
    'w-full rounded-lg border border-white/10 bg-ink px-4 py-2.5 text-white placeholder-gray-500 focus:border-gold focus:ring-gold';

function Field({ label, error, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-300">{label}</span>
            {children}
            {error && <span className="mt-1 block text-sm text-red-400">{error}</span>}
        </label>
    );
}

function Contact({ user, freelancer }) {
    const t = useT();
    return (
        <section id="contact" className="border-t border-white/5 py-20">
            <div className="mx-auto max-w-3xl px-6 text-center">
                <SectionTitle ghost="Talk">
                    <span className="block text-center">{t("Let's Talk")}</span>
                </SectionTitle>
                <p className="mx-auto mb-6 max-w-xl text-gray-300">
                    {t('Connect with Taha directly through live chat to discuss your project.')}
                </p>

                <div className="mx-auto mb-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-300">
                    {freelancer?.phone && (
                        <a href={`tel:${freelancer.phone}`} className="flex items-center gap-2 transition hover:text-gold">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-gold">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.53 15.53 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.36 11.36 0 003.57.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" /></svg>
                            </span>
                            {freelancer.phone}
                        </a>
                    )}
                    {freelancer?.email && (
                        <a href={`mailto:${freelancer.email}`} className="flex items-center gap-2 transition hover:text-gold">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-gold">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
                            </span>
                            {freelancer.email}
                        </a>
                    )}
                    {freelancer?.location && (
                        <span className="flex items-center gap-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-gold">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" /></svg>
                            </span>
                            {freelancer.location}
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                    {user ? (
                        <Link
                            href={route('chat.index')}
                            className="rounded-full bg-gold px-8 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-gold-300"
                        >
                            {t('Open Chat')}
                        </Link>
                    ) : (
                        <Link
                            href={route('login')}
                            className="rounded-full bg-gold px-8 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-gold-300"
                        >
                            {t('Log in to Chat')}
                        </Link>
                    )}
                    {freelancer?.email && (
                        <a
                            href={`mailto:${freelancer.email}`}
                            className="rounded-full border border-white/20 px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:border-gold hover:text-gold"
                        >
                            {t('Email Me')}
                        </a>
                    )}
                </div>

                <ContactForm />
            </div>
        </section>
    );
}

function Stars({ value, onChange }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type={onChange ? 'button' : undefined}
                    disabled={!onChange}
                    onClick={onChange ? () => onChange(n) : undefined}
                    className={`text-lg ${onChange ? 'cursor-pointer' : 'cursor-default'} ${n <= value ? 'text-gold' : 'text-white/20'}`}
                    aria-label={onChange ? `Rate ${n} of 5` : undefined}
                >
                    ★
                </button>
            ))}
        </div>
    );
}

function Testimonials({ testimonials, user }) {
    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm({
        rating: 5,
        body: '',
        role_title: '',
    });

    const isClient = user && user.role === 'client';

    const submit = (e) => {
        e.preventDefault();
        post(route('testimonials.store'), { preserveScroll: true, onSuccess: () => reset() });
    };

    return (
        <section id="testimonials" className="border-t border-white/5 py-20">
            <div className="mx-auto max-w-6xl px-6">
                <SectionTitle ghost="Reviews">What Clients Say</SectionTitle>

                {testimonials?.length ? (
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {testimonials.map((t) => (
                            <div key={t.id} className="rounded-2xl border border-white/5 bg-ink-700 p-6">
                                <Stars value={t.rating} />
                                <p className="mt-3 text-sm leading-relaxed text-gray-300">“{t.body}”</p>
                                <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-4">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-sm font-bold text-ink">
                                        {(t.user?.name ?? '?').charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{t.user?.name}</p>
                                        {t.role_title && <p className="text-xs text-gray-500">{t.role_title}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No reviews yet — be the first to leave one.</p>
                )}

                {isClient && (
                    <form onSubmit={submit} className="mt-10 max-w-2xl space-y-4 rounded-2xl border border-white/5 bg-ink-700 p-6">
                        <h3 className="font-bold text-white">Leave a review</h3>
                        {wasSuccessful && (
                            <p className="rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-400">
                                Thanks! Your review will appear once Taha approves it.
                            </p>
                        )}
                        <div>
                            <span className="mb-1 block text-sm text-gray-400">Your rating</span>
                            <Stars value={data.rating} onChange={(n) => setData('rating', n)} />
                            {errors.rating && <span className="mt-1 block text-sm text-red-400">{errors.rating}</span>}
                        </div>
                        <Field label="Your role (optional)" error={errors.role_title}>
                            <input type="text" value={data.role_title} onChange={(e) => setData('role_title', e.target.value)} className={inputCls} placeholder="e.g. CEO, Acme Inc." />
                        </Field>
                        <Field label="Your review" error={errors.body}>
                            <textarea rows={3} value={data.body} onChange={(e) => setData('body', e.target.value)} className={inputCls} placeholder="How was working with Taha?" />
                        </Field>
                        <button type="submit" disabled={processing} className="rounded-full bg-gold px-8 py-2.5 text-sm font-bold uppercase text-ink transition hover:bg-gold-300 disabled:opacity-60">
                            {processing ? 'Sending…' : 'Submit review'}
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
}

function ContactForm() {
    const t = useT();
    const { data, setData, post, processing, errors, reset, transform, wasSuccessful } = useForm({
        name: '',
        email: '',
        subject: '',
        body: '',
        website: '', // honeypot — must stay empty; only bots fill hidden fields
    });

    // When the form first mounted, so the server can reject instant (bot) submits.
    const startedAt = useRef(Date.now());

    const submit = (e) => {
        e.preventDefault();
        transform((d) => ({ ...d, elapsed: Date.now() - startedAt.current }));
        post(route('contact.store'), { preserveScroll: true, onSuccess: () => reset() });
    };

    return (
        <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-white/5 bg-ink-700 p-6 text-left">
            <h3 className="mb-1 font-bold text-white">{t('Send a message')}</h3>
            <p className="mb-5 text-sm text-gray-400">{t('No account needed — Taha will reply to your email.')}</p>

            {wasSuccessful && (
                <p className="mb-4 rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-400">
                    {t('Thanks for reaching out! Taha will get back to you soon.')}
                </p>
            )}

            <form onSubmit={submit} className="space-y-4">
                {/* Honeypot: hidden from humans, irresistible to bots. Real users
                    never see or fill it, so any value here means a bot. */}
                <div className="hidden" aria-hidden="true">
                    <label>Website</label>
                    <input
                        type="text"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={data.website}
                        onChange={(e) => setData('website', e.target.value)}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('Your name')} error={errors.name}>
                        <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className={inputCls} />
                    </Field>
                    <Field label={t('Your email')} error={errors.email}>
                        <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className={inputCls} />
                    </Field>
                </div>
                <Field label={t('Subject')} error={errors.subject}>
                    <input type="text" value={data.subject} onChange={(e) => setData('subject', e.target.value)} className={inputCls} placeholder={t('What is it about?')} />
                </Field>
                <Field label={t('Message')} error={errors.body}>
                    <textarea rows={4} value={data.body} onChange={(e) => setData('body', e.target.value)} className={inputCls} />
                </Field>
                <button type="submit" disabled={processing} className="rounded-full bg-gold px-8 py-2.5 text-sm font-bold uppercase text-ink transition hover:bg-gold-300 disabled:opacity-60">
                    {processing ? t('Sending…') : t('Send message')}
                </button>
            </form>
        </div>
    );
}

export default function Home({ freelancer, testimonials }) {
    const { auth, flash } = usePage().props;
    useApplyDirection();
    const user = auth?.user;
    const [toast, setToast] = useState(flash?.success);

    useEffect(() => {
        setToast(flash?.success);
        if (flash?.success) {
            const t = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(t);
        }
    }, [flash?.success]);

    return (
        <div className="min-h-screen bg-ink text-white">
            <Head title="Taha Yassine Youssef — Freelance Developer" />
            <Navbar user={user} />

            {toast && (
                <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-green-500 px-5 py-3 text-sm font-medium text-white shadow-lg">
                    {toast}
                </div>
            )}

            <main>
                <Hero freelancer={freelancer} user={user} />
                <About freelancer={freelancer} user={user} />
                <Skills skills={freelancer?.skills} />
                <Services services={freelancer?.services} />
                <Projects projects={freelancer?.projects} />
                <Resume diplomas={freelancer?.diplomas} />
                <Experience experiences={freelancer?.experiences} />
                <Internships internships={freelancer?.internships} />
                <Testimonials testimonials={testimonials} user={user} />
                <TaskSection user={user} />
                <Contact user={user} freelancer={freelancer} />
            </main>

            <footer className="border-t border-white/5 py-8 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} Taha Yassine Youssef. All rights reserved.
            </footer>
        </div>
    );
}
