import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BarChart3, Instagram, PlusCircle } from "lucide-react";

export function Header() {
  return (
    <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* ロゴエリア */}
        <Link href="/instagram" className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="Vlog Analyst ロゴ"
            width={36}
            height={36}
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
