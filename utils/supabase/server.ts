import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../types/database';
import {
  createSupabaseClientWithConfig,
  getSupabaseServiceRoleKey,
} from './config';

export type ServerSupabaseClient = SupabaseClient<Database>;

export const createServerSupabaseClient = (): ServerSupabaseClient =>
  createSupabaseClientWithConfig(getSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
