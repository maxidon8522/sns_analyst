"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BarChart3, Instagram, LogIn, LogOut, Settings, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";

export function Header() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 md:px-10">
        {/* ロゴエリア */}
        <Link href="/analysis" className="flex items-center gap-4">
          <Image
            src="/logo.jpg"
            alt="Vlog Analyst ロゴ"
            width={130}
            height={130}
            priority
            className="rounded-md shadow-sm"
          />
          <span className="font-bold text-xl bg-gradient-to-r from-pink-500 to-orange-500 text-transparent bg-clip-text">
            Vlog Analyst
          </span>
        </Link>

        {/* メニューエリア */}
        <nav className="flex items-center gap-1">
          <Button variant="ghost" asChild className="gap-2">
            <Link href="/instagram">
              <Instagram className="w-4 h-4" />
              <span className="hidden md:inline">投稿一覧</span>
            </Link>
          </Button>

          <Button variant="ghost" asChild className="gap-2">
            <Link href="/analysis">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">分析レポート</span>
            </Link>
          </Button>

          <Button variant="ghost" asChild className="gap-2">
            <Link href="/account-advisor">
              <Sparkles className="w-4 h-4" />
              <span className="hidden md:inline">Advisor Prompt</span>
            </Link>
          </Button>

          {!loading && user ? (
            <>
              <Button variant="ghost" asChild className="gap-2">
                <Link href="/settings">
                  <Settings className="w-4 h-4" />
                  <span className="hidden md:inline">設定</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">ログアウト</span>
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" asChild className="gap-2">
              <Link href="/login">
                <LogIn className="w-4 h-4" />
                <span className="hidden md:inline">ログイン</span>
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
