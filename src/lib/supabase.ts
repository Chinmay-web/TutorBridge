import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // In dev, it's helpful to surface a clear warning when env vars are missing.
  // This won't throw in production but will make debugging easier locally.
  // eslint-disable-next-line no-console
  console.warn('Supabase environment variables are not set: VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY');
}

export const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_KEY ?? '');

export default supabase;
