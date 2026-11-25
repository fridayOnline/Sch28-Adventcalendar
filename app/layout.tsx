import type { Metadata } from 'next';
import DevBadge from '@/components/DevBadge';
import { eventYear } from '@/lib/publish';
import './globals.css';

export const metadata: Metadata = {
  title: `FriOn Advent Calendar ${eventYear()}`,
  description: `金オンのみんなで、クリスマスをお祝いしよう！12月1日から25日まで、趣味の記事が毎日ひとつずつ公開されます。毎朝6時、小箱の中から誰かの「好き」が届きます。`,
  // ホーム画面に追加したとき（iOS）の表示
  appleWebApp: { capable: true, title: 'Advent Calendar', statusBarStyle: 'default' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600..800&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="snow" aria-hidden="true" />
        <div className="page">{children}</div>
        <DevBadge />
      </body>
    </html>
  );
}
