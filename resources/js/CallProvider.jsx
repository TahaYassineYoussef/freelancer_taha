import CallOverlay from '@/Components/CallOverlay';
import useCall from '@/useCall';
import { initSupabase } from '@/supabase';
import { subscribeInbox, sendRealtimeSignal } from '@/callSignal';
import { usePage } from '@inertiajs/react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

/**
 * App-wide calling. Mounted once inside the dashboard shell so a user is rung
 * on ANY page, not only while a chat conversation is open. It polls the global
 * call endpoint for incoming offers and renders the call overlay itself.
 *
 * Any page can start a call via useCallContext().startCall(peerId, name, video).
 */
const CallCtx = createContext(null);

export function useCallContext() {
    return useContext(CallCtx);
}

export default function CallProvider({ children }) {
    const { auth, supabase: supabaseCfg } = usePage().props;
    const meId = auth?.user?.id;
    const meName = auth?.user?.name;

    const peerRef = useRef({ id: null, name: null });
    const [peerName, setPeerName] = useState(null);

    const sendSignal = (kind, payload = null) => {
        const to = peerRef.current.id;
        if (!to) return;
        // Fast path: instant delivery over Supabase Realtime.
        sendRealtimeSignal(to, { kind, payload, from_id: meId, from_name: meName });
        // Reliable path: DB-backed signal that also fires the FCM ring for a
        // closed app and is drained by the poll below (fallback if Realtime is
        // unavailable on either end).
        window.axios.post(route('calls.signal'), { to_id: to, kind, payload }).catch(() => {});
    };

    const call = useCall({
        sendSignal,
        onEnd: () => { peerRef.current = { id: null, name: null }; setPeerName(null); },
        // Caller records how the call ended → call-log card (+ missed notification).
        onCallEnded: ({ video, status, seconds }) => {
            const to = peerRef.current.id;
            if (!to) return;
            window.axios.post(route('calls.log'), { to_id: to, kind: video ? 'video' : 'voice', status, seconds }).catch(() => {});
        },
    });

    const startCall = (peerId, name, video) => {
        peerRef.current = { id: peerId, name };
        setPeerName(name);
        call.startCall(video);
    };

    // Route every polled signal; capture the caller as the peer on a fresh offer.
    const dispatchRef = useRef(() => {});
    dispatchRef.current = (s) => {
        if (s.kind === 'offer' && call.state === 'idle') {
            peerRef.current = { id: s.from_id, name: s.from_name };
            setPeerName(s.from_name);
        }
        call.handleSignal(s);
    };

    const active = call.state !== 'idle';

    // Instant path: subscribe to my Realtime inbox for incoming call signals.
    // Runs alongside the poll below; whichever delivers first wins, duplicates
    // are ignored. No-op if Supabase config isn't present.
    useEffect(() => {
        if (!meId || !supabaseCfg?.url || !supabaseCfg?.anonKey) return;
        initSupabase(supabaseCfg.url, supabaseCfg.anonKey);
        const unsubscribe = subscribeInbox(meId, (s) => dispatchRef.current(s));
        return unsubscribe;
    }, [meId, supabaseCfg?.url, supabaseCfg?.anonKey]);

    // Fallback path: poll for incoming call signals globally (faster during an
    // active call). Kept as a safety net even when Realtime is connected.
    useEffect(() => {
        const tick = () => {
            window.axios
                .get(route('calls.poll'))
                .then((res) => (res.data.signals || []).forEach((s) => dispatchRef.current(s)))
                .catch(() => {});
        };
        const id = setInterval(tick, active ? 600 : 2500);
        return () => clearInterval(id);
    }, [active]);

    return (
        <CallCtx.Provider value={{ startCall, callState: call.state }}>
            {children}
            <CallOverlay call={call} partnerName={peerName} />
        </CallCtx.Provider>
    );
}
