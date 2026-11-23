'use client';

import { useEffect, useState } from 'react';

const two = (n: number) => String(n).padStart(2, '0');

/** now はサーバーの「今」。DEV_NOW で時刻を固定しているときもそこから数える */
export default function Countdown({ target, now }: { target: string; now?: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const at = new Date(target).getTime();
    const offset = now ? new Date(now).getTime() - Date.now() : 0;
    const tick = () => setLeft(Math.max(0, at - (Date.now() + offset)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target, now]);

  if (left === null) return null;

  const s = Math.floor(left / 1000);
  const text = `${two(Math.floor(s / 3600))}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}`;

  return (
    <p
      style={{
        margin: '22px 0 0',
        display: 'inline-flex',
        gap: 8,
        padding: '12px 18px',
        borderRadius: 10,
        background: 'var(--paper)',
        font: '700 15px/1 var(--font-en)',
      }}
    >
      あと <span style={{ color: 'var(--red-ink)' }}>{text}</span>
    </p>
  );
}
