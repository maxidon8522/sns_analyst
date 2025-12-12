import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from '@supabase/supabase-js';

import type { Database } from '../../types/database';

type ClientOptions = SupabaseClientOptions<Database>;

const getEnvValue = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const getSupabaseUrl = (): string =>
  getEnvValue('NEXT_PUBLIC_SUPABASE_URL');

export const getSupabaseAnonKey = (): string =>
  getEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const getSupabaseServiceRoleKey = (): string =>
  getEnvValue('SUPABASE_SERVICE_ROLE_KEY');

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
