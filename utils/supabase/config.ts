import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from '@supabase/supabase-js';

import type { Database } from '../../types/database';

type ClientOptions = SupabaseClientOptions<Database>;

const requireEnv = (value: string | undefined, key: string): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const getSupabaseUrl = (): string =>
  requireEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL');

export const getSupabaseAnonKey = (): string =>
  requireEnv(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  );

export const getSupabaseServiceRoleKey = (): string =>
  requireEnv(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');

const baseOptions: ClientOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'sns-analyst',
    },
  },
};

export const createSupabaseClientWithConfig = (
  key: string,
  options?: ClientOptions,
): SupabaseClient<Database> =>
  createClient<Database>(
    getSupabaseUrl(),
    key,
    mergeClientOptions(baseOptions, options),
  );

const mergeClientOptions = (
  base: ClientOptions,
  overrides?: ClientOptions,
): ClientOptions => {
  const clonedBase: ClientOptions = {
    ...base,
    auth: base.auth ? { ...base.auth } : undefined,
    global: base.global
      ? {
          ...base.global,
          headers: base.global.headers
            ? { ...base.global.headers }
            : undefined,
        }
      : undefined,
  };

  if (!overrides) {
    return clonedBase;
  }

  return {
    ...clonedBase,
    ...overrides,
    auth: {
      ...(clonedBase.auth ?? {}),
      ...(overrides.auth ?? {}),
    },
    global: {
      ...(clonedBase.global ?? {}),
      ...(overrides.global ?? {}),
      headers: {
        ...(clonedBase.global?.headers ?? {}),
        ...(overrides.global?.headers ?? {}),
      },
    },
  };
};
