import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BarChart3, Instagram, PlusCircle } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 md:px-10">
        {/* ロゴエリア */}
        <Link href="/analysis" className="flex items-center gap-4">
          <Image
            src="/logo.jpg"
            alt="Vlog Analyst ロゴ"
            width={170}
            height={170}
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

          {/* 将来的な機能拡張用 */}
          {/* <Button variant="default" size="sm" className="gap-2 ml-2">
            <PlusCircle className="w-4 h-4" />
            <span className="hidden md:inline">手動追加</span>
          </Button> */}
        </nav>
      </div>
    </header>
  );
}
