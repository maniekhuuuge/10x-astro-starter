import { createClient } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY || supabaseAnonKey;

// Default user ID for development
export const DEFAULT_USER_ID = '55c1b9ca-5035-4cbc-b79d-1e0aa5e88c8a';

// Use service role key to bypass RLS policies for development
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseServiceKey); 