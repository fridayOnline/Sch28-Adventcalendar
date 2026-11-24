import Link from 'next/link';
import MobileMenu from '@/components/MobileMenu';
import { eventYear } from '@/lib/publish';

/** ロゴ（箱のアイコン＋FRION ADVENT CALENDAR 2026）。全ページ共通 */
export function Brand() {
  return (
    <Link className="brand" href="/">
      <svg className="brand-icon" width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <rect x="2" y="2" width="30" height="30" rx="4" fill="#C9A57C" />
        <path d="M17 2v30M2 17h30" stroke="#96701A" strokeWidth="2.4" />
        <path d="M17 17c-5-6-10-5-9-1s6 3 9 1zm0 0c5-6 10-5 9-1s-6 3-9 1z" fill="none" stroke="#96701A" strokeWidth="2" />
      </svg>
      <span>
        FRION ADVENT CALENDAR <em>{eventYear()}</em>
      </span>
    </Link>
  );
}

/** トップ用：ロゴ＋ナビ。640px未満はナビをハンバーガーメニューにたたむ */
export function MainHeader() {
  return (
    <header className="site-header wrap">
      <Brand />
      <nav className="nav nav-pc" aria-label="メイン">
        <a href="#calendar">カレンダー</a>
        <a href="#howto">参加のしかた</a>
        <Link className="btn btn-sm" href="/entry">
          空いている日を予約
        </Link>
      </nav>
      <MobileMenu />
    </header>
  );
}

/** 下層ページ用：ロゴ＋「カレンダーに戻る」 */
export function SubHeader() {
  return (
    <header className="site-header wrap">
      <Brand />
      <Link className="back-link" href="/">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span className="back-text">カレンダーに戻る</span>
      </Link>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer wrap">
      <p>FriOn Advent Calendar {eventYear()}</p>
      <p>記事はそれぞれの執筆者のサイトで公開されています</p>
    </footer>
  );
}
