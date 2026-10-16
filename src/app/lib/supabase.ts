import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  // eslint-disable-next-line no-console
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY');
}

export const SUPABASE_URL = supabaseUrl;

// Name of the person currently using the CRM (from the "Viewing as" switcher).
// Sent with every request as the x-actor header so the database audit trail
// records who made each change.
let actor = 'Admin';
export function setActor(name: string) { actor = name || 'Admin'; }
export function getActor() { return actor; }

const actorFetch: typeof fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
  const headers = new Headers(init.headers || {});
  headers.set('x-actor', actor.replace(/[^\x20-\x7E]/g, ''));
  return fetch(input, { ...init, headers });
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: actorFetch },
});
