import { createClient } from '@supabase/supabase-js';

// Default user ID for development
export const DEFAULT_USER_ID = '55c1b9ca-5035-4cbc-b79d-1e0aa5e88c8a';

// Get the Supabase URL and key from environment variables
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.error('Missing SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('Missing SUPABASE_KEY environment variable');
}

// Create a Supabase client
export const supabaseClient = createClient(
  supabaseUrl || 'http://127.0.0.1:54321', 
  supabaseAnonKey || 'your-anon-key'
); 
