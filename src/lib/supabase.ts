import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'supabase_config_url';
const STORAGE_KEY_KEY = 'supabase_config_anon_key';

export function sanitizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();
  // If user pasted REST URL like https://xyz.supabase.co/rest/v1 or https://xyz.supabase.co/rest/v1/
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  // Check localStorage overrides first, then environment variables
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : null;

  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return {
    url: sanitizeSupabaseUrl(localUrl || envUrl || ''),
    anonKey: (localKey || envKey || '').trim(),
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    const cleanUrl = sanitizeSupabaseUrl(url);
    if (cleanUrl) localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
    else localStorage.removeItem(STORAGE_KEY_URL);

    if (anonKey) localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
    else localStorage.removeItem(STORAGE_KEY_KEY);
  }
}

export function clearSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
  }
}

let cachedClient: SupabaseClient | null = null;
let lastClientUrl = '';
let lastClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey) {
    return null;
  }

  // Basic URL validation
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return null;
  }

  if (cachedClient && lastClientUrl === url && lastClientKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastClientUrl = url;
    lastClientKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function checkSupabaseConnection(): Promise<{ success: boolean; message: string; tableExists?: boolean }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL and Anon Key are not configured.',
    };
  }

  try {
    // Try querying 1 row from the 'todos' table
    const { error } = await client.from('todos').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        // relation does not exist
        return {
          success: true,
          tableExists: false,
          message: 'Connected to Supabase project, but the "todos" table does not exist yet. Run the SQL schema script.',
        };
      }
      return {
        success: false,
        message: `Supabase returned an error: ${error.message}`,
      };
    }

    return {
      success: true,
      tableExists: true,
      message: 'Successfully connected to Supabase and verified "todos" table!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Could not connect to Supabase endpoint.',
    };
  }
}

export const SUPABASE_SQL_SCHEMA = `-- Run this in your Supabase SQL Editor to create the todos table:

CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT DEFAULT 'General',
  due_date DATE,
  subtasks JSONB DEFAULT '[]'::jsonb,
  is_starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their own tasks, and allow public access for anonymous sessions
CREATE POLICY "Users can manage their tasks"
  ON public.todos FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
`;
