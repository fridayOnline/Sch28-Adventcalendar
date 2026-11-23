'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

/** 640px未満で出すハンバーガーメニュー。リンクを押したら閉じる */
export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="menu" ref={ref}>
      <button
        type="button"
        className="menu-btn"
        aria-label={open ? 'メニューを閉じる' : 'メニュー'}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      <nav id="mobile-menu" className="menu-panel" aria-label="メイン" hidden={!open}>
        <a href="#calendar" onClick={close}>
          カレンダー
        </a>
        <a href="#howto" onClick={close}>
          参加のしかた
        </a>
        <Link className="btn btn-sm" href="/entry" onClick={close}>
          空いている日を予約
        </Link>
      </nav>
    </div>
  );
}
