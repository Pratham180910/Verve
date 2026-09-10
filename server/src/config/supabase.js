import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = () => {
  const url = process.env.SUPABASE_URL || supabaseUrl;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseServiceRoleKey;
  return Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    !url.includes('your-supabase-url') &&
    !key.includes('your-service-role-key')
  );
};

// Use real credentials if provided; fallback dummy URL to avoid immediate initialization throws
export const supabase = createClient(
  isSupabaseConfigured() ? (process.env.SUPABASE_URL || supabaseUrl) : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? (process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseServiceRoleKey) : 'dummy-service-role-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
