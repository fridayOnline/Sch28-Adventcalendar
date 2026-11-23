import type { Metadata } from 'next';
import DevBadge from '@/components/DevBadge';
import { eventYear } from '@/lib/publish';
import './globals.css';

export const metadata: Metadata = {
  title: `アドベントカレンダー ${eventYear()}`,
  description: `好きなことを、1日1本。12月1日から25日まで、メンバーが趣味の記事を毎日ひとつずつ公開します。`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Zen+Maru+Gothic:wght@500;700&display=swap"
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
