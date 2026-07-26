import { createClient } from '@supabase/supabase-js';

/**
 * Lazily-created singleton Supabase client, used only for Realtime call
 * signalling (Broadcast). The url + anon key are public and arrive via Inertia
 * shared props (see HandleInertiaRequests). If they're missing, getSupabase()
 * returns null and callers fall back to the HTTP poll — nothing breaks.
 */
let client = null;

export function initSupabase(url, anonKey) {
    if (!client && url && anonKey) {
        client = createClient(url, anonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            realtime: { params: { eventsPerSecond: 20 } },
        });
    }
    return client;
}

export function getSupabase() {
    return client;
}
