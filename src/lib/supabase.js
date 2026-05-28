import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Custom Cookie Storage Adapter for Cross-Subdomain SSO
const sharedCookieStorage = {
  getItem: (key) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  },
  setItem: (key, value) => {
    if (typeof document === 'undefined') return;
    // CRITICAL: The leading dot (.spotlexworld.com) allows both app. and shop. to share this session
    document.cookie = `${key}=${encodeURIComponent(value)}; domain=.spotlexworld.com; path=/; max-age=31536000; SameSite=Lax; Secure`;
  },
  removeItem: (key) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; domain=.spotlexworld.com; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure`;
  }
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: sharedCookieStorage,
      // We use a custom key to prevent clashing with Next.js SSR chunking formats
      storageKey: 'spotlex-ecosystem-token',
    }
  }
);