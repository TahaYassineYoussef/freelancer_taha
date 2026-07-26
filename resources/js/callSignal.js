import { getSupabase } from '@/supabase';

/**
 * Instant call signalling over Supabase Realtime Broadcast.
 *
 * Each signed-in user listens on their own channel `call-inbox-<myId>`. To ring
 * someone, we broadcast onto *their* inbox channel. The audio/video itself still
 * flows peer-to-peer over WebRTC — this only carries the offer/answer/ICE
 * handshake, delivered in ~tens of ms instead of waiting for the ~1s poll.
 *
 * This runs *alongside* the existing HTTP poll (which also handles FCM push for
 * a closed app), so if Realtime is unavailable the poll still delivers every
 * signal — just a little slower. Duplicate delivery is harmless: handleSignal()
 * ignores a second offer, and duplicate ICE/answer are caught and dropped.
 */

// Cache one outgoing channel per peer so bursts of ICE candidates reuse it.
const sendChannels = new Map();

function getSendChannel(toId) {
    let entry = sendChannels.get(toId);
    if (entry) return entry;

    const supabase = getSupabase();
    if (!supabase) return null;

    const channel = supabase.channel(`call-inbox-${toId}`);
    const ready = new Promise((resolve) => {
        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') resolve(true);
        });
    });
    entry = { channel, ready };
    sendChannels.set(toId, entry);
    return entry;
}

export async function sendRealtimeSignal(toId, data) {
    const entry = getSendChannel(toId);
    if (!entry) return; // no Realtime client — the HTTP POST fallback still delivers
    try {
        await entry.ready;
        await entry.channel.send({ type: 'broadcast', event: 'sig', payload: data });
    } catch {
        /* Realtime unavailable — the poll still delivers this signal */
    }
}

/**
 * Listen for signals addressed to me. `onSignal` receives the same shape the
 * poll produces: { kind, payload, from_id, from_name }. Returns an unsubscribe.
 */
export function subscribeInbox(myId, onSignal) {
    const supabase = getSupabase();
    if (!supabase) return () => {};

    const channel = supabase
        .channel(`call-inbox-${myId}`)
        .on('broadcast', { event: 'sig' }, ({ payload }) => onSignal(payload))
        .subscribe();

    return () => {
        try {
            supabase.removeChannel(channel);
        } catch {
            /* noop */
        }
    };
}
