import Link from 'next/link';
import { notFound } from 'next/navigation';
import BoxArt from '@/components/BoxArt';
import CommentSection from '@/components/CommentSection';
import Countdown from '@/components/Countdown';
import ReactionBar from '@/components/ReactionBar';
import { SiteFooter, SubHeader } from '@/components/SiteHeader';
import { currentTime, isPublished, PUBLISH_TIME_LABEL, publishAt, weekdayJa } from '@/lib/publish';
import { getCalendar, getDayDetail } from '@/lib/queries';

export const revalidate = 60;

const pad2 = (n: number) => String(n).padStart(2, '0');

export default async function DayPage({ params }: { params: Promise<{ day: string }> }) {
  const day = Number((await params).day);
  if (!Number.isInteger(day) || day < 1 || day > 25) notFound();

  const cells = await getCalendar();
  const cell = cells.find((c) => c.day === day);
  if (!cell || cell.state === 'open') notFound();

  const published = isPublished(day);
  const detail = published ? await getDayDetail(day) : null;
  if (published && !detail) notFound();

  const dateLabel = `12月${day}日（${weekdayJa(day)}）`;
  const prev = cells.find((c) => c.day === day - 1);
  const next = cells.find((c) => c.day === day + 1);


  return (
    <>
      <SubHeader />

      <main className="wrap detail-main">
        <section className="detail-hero">
          <BoxArt day={day} state={cell.state} size="big" />

          <div className="detail-text">
            {/* 日付（左）と、執筆者向けの「編集」ボタン（右端。カレンダーの箱の「編集」と同じ見た目） */}
            <div className="detail-kicker">
              <p className="label">
                DAY {pad2(day)} · {dateLabel}
              </p>
              <Link className="edit-pill" href={`/edit?day=${day}`} aria-label={`12月${day}日の枠を編集`}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 20h4L19 9l-4-4L4 16v4z" />
                  <path d="M13.5 6.5l4 4" />
                </svg>
                編集
              </Link>
            </div>

            {detail ? (
              <>
                <h1 className="detail-title">
                  {detail.title ?? '記事準備中'}
                </h1>
                {/* 記事を読むボタン（左）と著者名（右端）を1行に並べる */}
                <div className="detail-actions">
                  {detail.url ? (
                    <a className="btn" href={detail.url} target="_blank" rel="noopener noreferrer">
                      記事を読む
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M7 17L17 7M8 7h9v9" />
                      </svg>
                    </a>
                  ) : (
                    <p className="detail-nourl">記事はまだ登録されていません。コメントとリアクションは送れます。</p>
                  )}
                  <p className="detail-author">
                    by <b>{detail.authorName}</b>
                  </p>
                </div>
              </>
            ) : (
              <>
                <h1 className="detail-soon">Coming soon</h1>
                <p style={{ margin: '16px 0 0', fontSize: 16, lineHeight: 1.8, color: 'var(--ink-sub)' }}>
                  <b style={{ color: 'var(--ink)' }}>{cell.authorName}</b> さんの箱は {dateLabel} {PUBLISH_TIME_LABEL} に開きます。
                </p>
                <Countdown target={publishAt(day).toISOString()} now={currentTime().toISOString()} />
              </>
            )}
          </div>
        </section>

        {/* 公開前はリアクションもコメントも出さない */}
        {detail && (
          <>
            <ReactionBar day={day} initial={detail.reactions} />
            <CommentSection day={day} initial={detail.comments} />
          </>
        )}

        <nav aria-label="前後の日" className="day-nav">
          {prev && prev.state !== 'open' ? (
            <Link href={`/day/${prev.day}`}>
              ← 12/{prev.day} {prev.title ?? 'Coming soon'}
            </Link>
          ) : (
            <span />
          )}
          {next && next.state !== 'open' ? (
            <Link href={`/day/${next.day}`}>
              12/{next.day} {next.title ?? 'Coming soon'} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </main>

      <SiteFooter />
    </>
  );
}
