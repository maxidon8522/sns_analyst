import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const quickLinks = [
  {
    title: '投稿を取得する',
    description: 'Instagramの最新投稿を読み込み、タグ付けする動画を選びます。',
    href: '/instagram',
    action: 'Instagram一覧へ',
  },
  {
    title: '新規タグ付け',
    description:
      '既にMedia IDが分かっている場合はそのままタグ入力画面に移動できます。',
    href: '/videos/new',
    action: 'フォームを開く',
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <section className="space-y-4">
        <Badge variant="secondary" className="w-fit">
          SNS Analyst
        </Badge>
        <h1 className="text-3xl font-bold">Instagram Vlog Analytics</h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          InstagramのVlog運用を効率化するためのデータ分析ハブです。投稿の取得からタグ付け、
          metricsの自動収集、そして可視化までワンストップで行えます。
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/instagram">投稿を取り込む</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/videos/new">手動でタグ付け</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {quickLinks.map((link) => (
          <Card key={link.href}>
            <CardHeader>
              <CardTitle>{link.title}</CardTitle>
              <CardDescription>{link.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={link.href}>{link.action}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
