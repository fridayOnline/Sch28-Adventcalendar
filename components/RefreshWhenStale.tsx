'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { takeCalendarStale } from '@/lib/calendarStale';

/**
 * カレンダー（/）に置く。予約などで表示が古くなっていたら、表示した時点で最新を取り直す。
 * - ブラウザの「戻る」：Next.js のキャッシュから描き直されるのでマウント時に気づける
 * - bfcache（ページごと凍結して戻す）から戻ったときは pageshow で気づく
 * 取り直しは箱を作り直さないので、登場アニメーションはもう一度は流れない。
 */
export default function RefreshWhenStale() {
  const router = useRouter();

  useEffect(() => {
    if (takeCalendarStale()) router.refresh();
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted && takeCalendarStale()) router.refresh();
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, [router]);

  return null;
}
