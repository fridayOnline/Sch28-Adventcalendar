import Link from 'next/link';
import BoxArt, { Bow, Flap, SantaHat, Sweet } from '@/components/BoxArt';
import { weekdayEn } from '@/lib/publish';
import type { CalendarCell } from '@/types';

const pad2 = (n: number) => String(n).padStart(2, '0');

const CommentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.2-4.6A8 8 0 1 1 21 12z" />
  </svg>
);
const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 21C5 16 2 12.5 2 8.5A5 5 0 0 1 12 6a5 5 0 0 1 10 2.5c0 4-3 7.5-10 12.5z" />
  </svg>
);

/**
 * カレンダーの1マス。PC（7列グリッド）用の箱と、スマホ（640px未満の縦並びリスト）用の行を
 * 両方出して、CSS のメディアクエリでどちらか一方だけを表示する。
 */
export default function DayCell({ cell }: { cell: CalendarCell }) {
  const { day, state, authorName, title, commentCount, reactionCount, isToday } = cell;
  const delay = `${(0.04 + (day - 1) * 0.045).toFixed(3)}s`;
  // 箱が開き始める時刻。登場し終わってから 1日目→N日目 の順に 0.12s ずつずらして開く
  const openAt = `${(0.7 + (day - 1) * 0.12).toFixed(2)}s`;
  const dateEn = `12/${pad2(day)} ${weekdayEn(day)}${isToday ? ' · TODAY' : ''}`;
  const titleText = title ?? '記事準備中';

  return (
    <div className={`cell${isToday ? ' today' : ''}`} style={{ ['--d' as string]: delay, ['--o' as string]: openAt } as React.CSSProperties}>
      {/* ===== PC：箱 ===== */}
      <div className="cell-pc">
        {state === 'open' && (
          <Link className="bx bx-open" href={`/entry?day=${day}`} aria-label={`12月${day}日 募集中。予約する`}>
            <span className="open-cta">＋ 予約する</span>
            <span className="num num-soft">{day}</span>
            {isToday && <SantaHat />}
          </Link>
        )}

        {state === 'reserved' && (
          <div className="bx bx-wrap">
            <Bow />
            <span className="tag">{authorName}</span>
            <Link className="edit" href={`/edit?day=${day}`} aria-label={`12月${day}日の枠を編集`}>
              編集
            </Link>
            <span className="num">{day}</span>
            <span className="sr-only">
              12月{day}日 {authorName} 公開前
            </span>
            {isToday && <SantaHat />}
          </div>
        )}

        {state === 'published' && (
          <Link className="bx bx-pub opener" href={`/day/${day}`} aria-label={`12月${day}日 ${titleText}（${authorName}）`}>
            <span className="sweet" aria-hidden="true">
              <Sweet day={day} />
            </span>
            <span className="ptitle">{titleText}</span>
            <span className="meta">
              <span>
                <CommentIcon />
                {commentCount}
              </span>
              <span>
                <HeartIcon />
                {reactionCount}
              </span>
            </span>
            <Flap day={day} />
            {isToday && <SantaHat />}
          </Link>
        )}
      </div>

      {/* ===== スマホ：リストの行 ===== */}
      {state === 'open' && (
        <Link className="row row-open" href={`/entry?day=${day}`} aria-label={`12月${day}日 募集中。予約する`}>
          <BoxArt day={day} state="open" size="thumb" />
          <span className="row-body">
            <span className="row-date">{dateEn}</span>
          </span>
          <span className="row-cta" aria-hidden="true">
            ＋ 予約する
          </span>
        </Link>
      )}

      {state === 'reserved' && (
        <div className="row">
          <BoxArt day={day} state="reserved" size="thumb" />
          <span className="row-body">
            <span className="row-date">{dateEn}</span>
            <span className="row-main">{authorName}</span>
          </span>
          <Link className="row-edit" href={`/edit?day=${day}`} aria-label={`12月${day}日の枠を編集`}>
            編集
          </Link>
        </div>
      )}

      {state === 'published' && (
        <Link className="row" href={`/day/${day}`}>
          <BoxArt day={day} state="published" size="thumb" />
          <span className="row-body">
            <span className="row-date">{dateEn}</span>
            <span className="row-main row-ellipsis">{titleText}</span>
            <span className="row-sub">
              {authorName} · コメント {commentCount} · リアクション {reactionCount}
            </span>
          </span>
        </Link>
      )}
    </div>
  );
}
