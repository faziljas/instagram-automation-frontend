import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
const isConfigured = !!(supabaseUrl && supabaseAnonKey && 
                       supabaseUrl !== '' && 
                       supabaseAnonKey !== '');

// Create Supabase client with fallback for development
// This allows the app to start even if env vars aren't set yet
let supabase: SupabaseClient;

if (isConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
} else {
  // Create a dummy client that will fail gracefully when used
  // This prevents the app from crashing on startup
  supabase = createClient(
    'https://placeholder.supabase.co',
    'placeholder-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
}

export { supabase };

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

// Helper function to get a safe Supabase client (throws if not configured)
export function getSupabaseClient(): SupabaseClient {
  if (!isConfigured) {
    throw new Error(
      'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file. ' +
      'See SUPABASE_SETUP.md for instructions.'
    );
  }
  return supabase;
}
