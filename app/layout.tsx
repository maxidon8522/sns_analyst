import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/header';
import { AuthProvider } from '@/components/auth/auth-provider';
import { AuthGate } from '@/components/auth/auth-gate';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vlog Analyst',
  description: 'Instagram vlog analysis tool',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          <main className="min-h-screen w-full max-w-7xl mx-auto p-6 md:p-10">
            <AuthGate>{children}</AuthGate>
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
