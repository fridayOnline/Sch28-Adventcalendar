import Link from 'next/link';
import { weekdayJa } from '@/lib/publish';
import type { CalendarCell } from '@/types';

/** /entry に day が無いときの、空き日の一覧 */
export default function DayPicker({ cells }: { cells: CalendarCell[] }) {
  const open = cells.filter((c) => c.state === 'open');

  if (open.length === 0) {
    return (
      <div className="form-card">
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8 }}>
          空いている日がありません。すべての枠が埋まりました。
        </p>
        <Link className="btn" href="/">
          カレンダーへ戻る
        </Link>
      </div>
    );
  }

  return (
    <>
      <p style={{ margin: '0 0 20px', fontSize: 15, color: 'var(--ink-sub)' }}>
        空いている日が {open.length} 日あります。予約する日を選んでください。
      </p>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
          gap: '20px 14px',
        }}
      >
        {open.map((c, i) => (
          <li key={c.day} className="cell" style={{ ['--d' as string]: `${(i * 0.04).toFixed(2)}s` } as React.CSSProperties}>
            <Link
              className="bx bx-open"
              href={`/entry?day=${c.day}`}
              aria-label={`12月${c.day}日（${weekdayJa(c.day)}）を予約する`}
            >
              <span className="open-lbl">
                12/{c.day}（{weekdayJa(c.day)}）
              </span>
              <span className="open-cta">＋ 予約する</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
