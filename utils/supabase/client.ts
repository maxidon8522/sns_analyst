import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../types/database';
import {
  createSupabaseClientWithConfig,
  getSupabaseAnonKey,
} from './config';

export type BrowserSupabaseClient = SupabaseClient<Database>;

let browserClient: BrowserSupabaseClient | null = null;

export const getBrowserSupabaseClient = (): BrowserSupabaseClient => {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserSupabaseClient can only be used in the browser.');
  }

  if (!browserClient) {
    browserClient = createSupabaseClientWithConfig(getSupabaseAnonKey(), {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
};
