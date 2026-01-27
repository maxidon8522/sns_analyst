import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/utils/supabase/config";

const getCookieStore = () => cookies();

export const createServerSupabaseUserClient = () => {
  const cookieStore = getCookieStore();
  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
    },
  });
};

export const createServerSupabaseUserActionClient = () => {
  const cookieStore = getCookieStore();
  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set({ name, value, ...options });
        });
      },
    },
  });
};
