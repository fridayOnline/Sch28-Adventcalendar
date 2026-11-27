'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { homeHref } from '@/lib/calendars';

/**
 * カレンダー（/）へ戻るリンク。
 * 普通の <Link> だと、前に見たカレンダーがブラウザのルーターキャッシュから出てきて、
 * 予約・編集した直後でも古い状態（「募集中」のまま等）に見える。
 * API の revalidatePath はこのキャッシュを消さないので、移動と同時に router.refresh() で取り直す。
 */
export default function CalendarLink({
  onClick,
  cal = 1,
  ...props
}: Omit<ComponentProps<typeof Link>, 'href'> & { /** 戻り先のカレンダー（2枚目なら /?cal=2） */ cal?: number }) {
  const router = useRouter();
  const href = homeHref(cal);

  return (
    <Link
      {...props}
      href={href}
      onClick={(e) => {
        onClick?.(e);
        // 新しいタブで開く（⌘/Ctrl/Shift/中クリック）ときはブラウザに任せる
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        router.push(href);
        router.refresh();
      }}
    />
  );
}
