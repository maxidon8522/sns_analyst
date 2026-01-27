"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";

const PUBLIC_PATHS = new Set<string>(["/login"]);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_PATHS.has(pathname);

    if (!user && !isPublic) {
      router.replace("/login");
    }

    if (user && pathname === "/login") {
      router.replace("/analysis");
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        読み込み中...
      </div>
    );
  }

  if (!user && !PUBLIC_PATHS.has(pathname)) {
    return null;
  }

  if (user && pathname === "/login") {
    return null;
  }

  return <>{children}</>;
}
