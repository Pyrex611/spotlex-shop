import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Export a flag so our context knows if it's safe to make API calls
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// We provide dummy URLs if missing so the createClient function doesn't crash the React tree.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);