import Link from 'next/link';
import { SiteFooter, SubHeader } from '@/components/SiteHeader';

export default function NotFound() {
  return (
    <>
      <SubHeader />
      <main className="wrap" style={{ maxWidth: 560, padding: '96px 32px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, font: '800 64px/1 var(--font-en)', color: 'var(--red-ink)' }}>404</h1>
        <p style={{ margin: '20px 0 32px', fontSize: 16, color: 'var(--ink-sub)' }}>
          ページが見つかりません。
        </p>
        <Link className="btn" href="/">
          カレンダーへ戻る
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
