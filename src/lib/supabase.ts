import { createClient } from './supabase/client';

export { createClient };

export function supabase() {
  return createClient();
}
