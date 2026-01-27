"use client";

import { useEffect, useState } from "react";

import type { BrowserSupabaseClient } from "@/utils/supabase/client";
import { getBrowserSupabaseClient } from "@/utils/supabase/client";

export function useBrowserSupabaseClient(): BrowserSupabaseClient | null {
  const [client, setClient] = useState<BrowserSupabaseClient | null>(null);

  useEffect(() => {
    setClient(getBrowserSupabaseClient());
  }, []);

  return client;
}
