import PanelLayout from '@/Layouts/PanelLayout';
import Photo from '@/Components/Photo';
import { useCallContext } from '@/CallProvider';
import { useT } from '@/i18n';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const FREELANCER_PHOTO = ['/images/taha.png', '/images/taha.jpg'];
const MAX_MB = 25;

function fmtTime(value) {
    return new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function isImage(mime) {
    return typeof mime === 'string' && mime.startsWith('image/');
}

function fmtDuration(s) {
    if (!s) return null;
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Messenger-style centered card for a call event in the thread. */
function CallCard({ m }) {
    const video = m.call_kind === 'video';
    const icon = video ? '📹' : '📞';
    let label;
    if (m.call_status === 'completed') label = `${video ? 'Video' : 'Voice'} call ended${m.call_seconds ? ` · ${fmtDuration(m.call_seconds)}` : ''}`;
    else if (m.call_status === 'missed') label = `Missed ${video ? 'video' : 'voice'} call`;
    else label = `${video ? 'Video' : 'Voice'} call declined`;
    const danger = m.call_status !== 'completed';
    return (
        <div className="my-1 flex justify-center">
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold ${danger ? 'bg-red-500/10 text-red-300' : 'bg-white/5 text-gray-300'}`}>
                <span>{icon}</span>
                {label}
                <span className="text-gray-500">· {fmtTime(m.created_at)}</span>
            </span>
        </div>
    );
}

/**
 * Voice/video call buttons. Kept as its own component so its useCallContext()
 * runs INSIDE the CallProvider (which lives in PanelLayout, below this page).
 */
function CallButtons({ partner }) {
    const ctx = useCallContext();
    if (!ctx || !partner) return null;
    const { startCall } = ctx;
    return (
        <>
            <button onClick={() => startCall(partner.id, partner.name, false)} title="Voice call"
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-300 transition hover:bg-white/10 hover:text-gold">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h2.5a1 1 0 011 .76l1 4a1 1 0 01-.29.95l-1.7 1.7a13 13 0 006.1 6.1l1.7-1.7a1 1 0 01.95-.29l4 1a1 1 0 01.76 1V19a2 2 0 01-2 2A16 16 0 013 5z" /></svg>
            </button>
            <button onClick={() => startCall(partner.id, partner.name, true)} title="Video call"
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-300 transition hover:bg-white/10 hover:text-gold">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.55-2.28A1 1 0 0121 8.6v6.8a1 1 0 01-1.45.89L15 14v1a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h8a2 2 0 012 2z" /></svg>
            </button>
        </>
    );
}

function Attachment({ url, name, mime, mine }) {
    if (!url) return null;
    if (isImage(mime)) {
        return (
            <a href={url} target="_blank" rel="noreferrer" className="mt-1 block">
                <img src={url} alt={name} className="max-h-60 w-auto rounded-xl border border-black/10" />
            </a>
        );
    }
    return (
        <a
            href={url}
            target="_blank"
            rel="noreferrer"
            download
            className={`mt-1 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
                mine ? 'border-ink/20 bg-ink/10 text-ink' : 'border-white/10 bg-black/20 text-gray-100'
            }`}
        >
            <span className="text-base">📎</span>
            <span className="max-w-[180px] truncate">{name || 'Download file'}</span>
        </a>
    );
}

export default function Chat({ partners, selectedPartner, messages: initialMessages }) {
    const { auth } = usePage().props;
    const meId = auth.user.id;
    const t = useT();

    const [messages, setMessages] = useState(initialMessages ?? []);
    const [body, setBody] = useState('');
    const [file, setFile] = useState(null);
    const [sending, setSending] = useState(false);
    const [partnerTyping, setPartnerTyping] = useState(false);
    const [error, setError] = useState('');

    const listRef = useRef(null);
    const prevPartnerRef = useRef(selectedPartner?.id);
    const fileRef = useRef(null);
    const typingClear = useRef(null);
    const lastTypingSent = useRef(0);

    // Show the typing indicator when a typing ping arrives from the poll. A ref
    // keeps this fresh so the interval closure never goes stale.
    const showTypingRef = useRef(() => {});
    showTypingRef.current = () => {
        setPartnerTyping(true);
        clearTimeout(typingClear.current);
        typingClear.current = setTimeout(() => setPartnerTyping(false), 2500);
    };

    // Reset the thread whenever a different conversation is opened.
    useEffect(() => {
        setMessages(initialMessages ?? []);
        setPartnerTyping(false);
        setFile(null);
        setBody('');
    }, [selectedPartner?.id]);

    // Poll ~1.2s for new messages + typing pings for the open conversation.
    useEffect(() => {
        if (!selectedPartner) return;
        const tick = () => {
            window.axios
                .get(route('chat.poll', selectedPartner.id))
                .then((res) => {
                    setMessages(res.data.messages);
                    if ((res.data.signals || []).some((s) => s.kind === 'typing')) showTypingRef.current();
                })
                .catch(() => {});
        };
        const id = setInterval(tick, 1200);
        return () => clearInterval(id);
    }, [selectedPartner?.id]);

    // Auto-scroll the message list — and ONLY the list, never the window — to the
    // newest message. scrollIntoView() used to scroll the whole page down on every
    // 1.2s poll, pushing the call buttons out of reach. Set the container's
    // scrollTop instead, and only when switching conversations or already near the
    // bottom, so scrolling up to read history isn't yanked back down.
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        const switched = prevPartnerRef.current !== selectedPartner?.id;
        prevPartnerRef.current = selectedPartner?.id;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
        if (switched || nearBottom) el.scrollTop = el.scrollHeight;
    }, [messages, partnerTyping, selectedPartner?.id]);

    const pingTyping = () => {
        if (!selectedPartner) return;
        const now = Date.now();
        if (now - lastTypingSent.current < 1800) return; // throttle
        lastTypingSent.current = now;
        window.axios.post(route('chat.signal', selectedPartner.id), { kind: 'typing' }).catch(() => {});
    };

    const pickFile = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (f.size > MAX_MB * 1024 * 1024) {
            setError(`File is too big (max ${MAX_MB} MB).`);
            e.target.value = '';
            return;
        }
        setError('');
        setFile(f);
    };

    const send = (e) => {
        e.preventDefault();
        const text = body.trim();
        if ((!text && !file) || !selectedPartner || sending) return;

        setSending(true);
        setError('');
        const form = new FormData();
        if (text) form.append('body', text);
        if (file) form.append('attachment', file);

        window.axios
            .post(route('chat.store', selectedPartner.id), form)
            .then((res) => {
                setMessages(res.data.messages);
                setBody('');
                setFile(null);
                if (fileRef.current) fileRef.current.value = '';
            })
            .catch((err) => setError(err.response?.data?.message || 'Could not send. Try again.'))
            .finally(() => setSending(false));
    };

    const openConversation = (partner) => {
        router.get(route('chat.index'), { with: partner.id }, { preserveState: false });
    };

    // Index of my last message, to show a single Sent/Seen receipt beneath it.
    const myLastIndex = (() => {
        for (let i = messages.length - 1; i >= 0; i--) if (messages[i].sender_id === meId && !messages[i].call_status) return i;
        return -1;
    })();

    return (
        <PanelLayout title="Messages">
            <Head title="Chat" />

            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                {/* Conversation list */}
                <aside className="rounded-2xl border border-white/5 bg-ink-700 p-3">
                    <h2 className="px-3 py-2 text-sm font-semibold uppercase tracking-wide text-gray-400">{t('Conversations')}</h2>
                    <div className="space-y-1">
                        {partners.length === 0 && <p className="px-3 py-4 text-sm text-gray-500">{t('No conversations yet.')}</p>}
                        {partners.map((p) => {
                            const active = selectedPartner?.id === p.id;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => openConversation(p)}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${active ? 'bg-gold/15' : 'hover:bg-white/5'}`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <Photo src={p.role === 'freelancer' ? FREELANCER_PHOTO : null} name={p.name} rounded="rounded-full" className="h-10 w-10" />
                                        {p.unread > 0 && (
                                            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                                {p.unread > 9 ? '9+' : p.unread}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`truncate text-sm ${p.unread > 0 ? 'font-bold text-white' : 'font-semibold'} ${active ? 'text-gold' : p.unread > 0 ? 'text-white' : 'text-white'}`}>{p.name}</p>
                                        <p className="truncate text-xs capitalize text-gray-500">{p.unread > 0 ? <span className="font-semibold text-gold">{t('New message')}</span> : p.role}</p>
                                    </div>
                                    {p.unread > 0 && <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-gold" />}
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* Message thread */}
                <section className="flex h-[65vh] flex-col rounded-2xl border border-white/5 bg-ink-700">
                    {selectedPartner ? (
                        <>
                            <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
                                <Photo src={selectedPartner.role === 'freelancer' ? FREELANCER_PHOTO : null} name={selectedPartner.name} rounded="rounded-full" className="h-10 w-10" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-white">{selectedPartner.name}</p>
                                    <p className="text-xs capitalize text-gray-500">{partnerTyping ? <span className="text-gold">typing…</span> : selectedPartner.role}</p>
                                </div>
                                <CallButtons partner={selectedPartner} />
                            </div>

                            <div ref={listRef} className="flex-1 space-y-1.5 overflow-y-auto px-5 py-4">
                                {messages.length === 0 && <p className="mt-10 text-center text-sm text-gray-500">{t('No messages yet. Say hello 👋')}</p>}
                                {messages.map((m, i) => {
                                    if (m.call_status) return <CallCard key={m.id} m={m} />;
                                    const mine = m.sender_id === meId;
                                    return (
                                        <div key={m.id}>
                                            <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${mine ? 'rounded-br-sm bg-gold text-ink' : 'rounded-bl-sm bg-ink-600 text-gray-100'}`}>
                                                    {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                                                    <Attachment url={m.attachment_url} name={m.attachment_name} mime={m.attachment_mime} mine={mine} />
                                                    <p className={`mt-1 text-[10px] ${mine ? 'text-ink/60' : 'text-gray-500'}`}>{fmtTime(m.created_at)}</p>
                                                </div>
                                            </div>
                                            {mine && i === myLastIndex && (
                                                <p className="mt-0.5 pr-1 text-right text-[10px] text-gray-500">{m.read ? `✓✓ ${t('Seen')}` : `✓ ${t('Sent')}`}</p>
                                            )}
                                        </div>
                                    );
                                })}
                                {partnerTyping && (
                                    <div className="flex justify-start">
                                        <div className="rounded-2xl rounded-bl-sm bg-ink-600 px-4 py-3">
                                            <span className="flex gap-1">
                                                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                                                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                                                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Selected-file preview + errors */}
                            {(file || error) && (
                                <div className="border-t border-white/5 px-4 pt-3">
                                    {file && (
                                        <div className="mb-2 flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 text-xs text-gold">
                                            <span>📎</span>
                                            <span className="max-w-[220px] truncate">{file.name}</span>
                                            <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }} className="ml-auto text-gray-400 hover:text-white">✕</button>
                                        </div>
                                    )}
                                    {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
                                </div>
                            )}

                            <form onSubmit={send} className="flex items-center gap-2 border-t border-white/5 p-4">
                                <input ref={fileRef} type="file" onChange={pickFile} className="hidden"
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.mp3,.mp4,.mov" />
                                <button type="button" onClick={() => fileRef.current?.click()} title="Attach a file"
                                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-white/10 hover:text-gold">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3 3 0 014.24 4.24l-9.2 9.19a1 1 0 01-1.41-1.41l8.49-8.49" /></svg>
                                </button>
                                <input type="text" value={body}
                                    onChange={(e) => { setBody(e.target.value); pingTyping(); }}
                                    placeholder={t('Type a message…')}
                                    className="flex-1 rounded-full border border-white/10 bg-ink px-5 py-2.5 text-white placeholder-gray-500 focus:border-gold focus:ring-gold" />
                                <button type="submit" disabled={sending || (!body.trim() && !file)}
                                    className="rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink transition hover:bg-gold-300 disabled:opacity-50">
                                    {sending ? '…' : t('Send')}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-1 items-center justify-center text-gray-500">{t('Select a conversation to start chatting.')}</div>
                    )}
                </section>
            </div>
        </PanelLayout>
    );
}
