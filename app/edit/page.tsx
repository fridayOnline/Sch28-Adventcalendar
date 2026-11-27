import Link from 'next/link';
import BoxArt from '@/components/BoxArt';
import EditForm from '@/components/EditForm';
import { SiteFooter, SubHeader } from '@/components/SiteHeader';
import { CALENDAR_COUNT, calendarPrefix, homeHref, parseCalParam } from '@/lib/calendars';
import { PUBLISH_TIME_LABEL, weekdayJa } from '@/lib/publish';
import { getCalendar } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function EditPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; cal?: string | string[] }>;
}) {
  const sp = await searchParams;
  const cal = parseCalParam(sp.cal);
  const cells = cal === null ? [] : await getCalendar(cal);
  const raw = Number(sp.day);
  const day = Number.isInteger(raw) && raw >= 1 && raw <= 25 ? raw : null;
  const cell = day ? cells.find((c) => c.day === day) : null;
  const dateLabel = day ? `${calendarPrefix(cal ?? 1)}12月${day}日（${weekdayJa(day)}）` : '';

  return (
    <>
      <SubHeader cal={cal ?? 1} />

      <main className="wrap sub-main" style={{ maxWidth: 648 }}>
        {cal === null || !day || !cell || cell.state === 'open' ? (
          <div className="form-card">
            <h1 style={{ margin: 0, fontSize: 24 }}>編集する枠が見つかりません</h1>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8, color: 'var(--ink-sub)' }}>
              カレンダーから自分の箱の「編集」を選んでください。
            </p>
            <Link className="btn" href={homeHref(cal ?? 1)}>
              カレンダーへ戻る
            </Link>
          </div>
        ) : (
          <>
            <div className="page-head">
              <BoxArt day={day} state={cell.state} size="mini" authorName={cell.authorName} />
              <div className="page-head-text">
                <p className="page-kicker">
                  EDIT{CALENDAR_COUNT > 1 && ` · CAL ${cal}`} · DAY {String(day).padStart(2, '0')}
                </p>
                <h1 className="page-title">{dateLabel}の記事を登録</h1>
                <p className="page-sub">
                  担当：{cell.authorName} ／ 公開 12/{day} {PUBLISH_TIME_LABEL}
                </p>
              </div>
            </div>
            <EditForm cal={cal} day={day} dateLabel={dateLabel} />
          </>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
