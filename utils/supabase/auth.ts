import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/utils/supabase/server";

export const getUserFromRequest = async (
  request: Request | NextRequest,
): Promise<{ user: User | null; token: string | null; error?: string }> => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, token: null, error: "Missing auth token" };
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return { user: null, token: null, error: "Missing auth token" };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return {
      user: null,
      token,
      error: error?.message ?? "Invalid auth token",
    };
  }

  return { user: data.user, token };
};
