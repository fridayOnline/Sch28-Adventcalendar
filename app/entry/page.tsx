import { notFound, redirect } from 'next/navigation';
import BoxArt from '@/components/BoxArt';
import DayPicker from '@/components/DayPicker';
import EntryForm from '@/components/EntryForm';
import { SiteFooter, SubHeader } from '@/components/SiteHeader';
import { CALENDAR_COUNT, CALENDARS, calendarLabel, calendarPrefix, homeHref, parseCalParam } from '@/lib/calendars';
import { weekdayJa } from '@/lib/publish';
import { getCalendar, isEntryOpen } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function EntryPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; cal?: string | string[] }>;
}) {
  const sp = await searchParams;
  const cal = parseCalParam(sp.cal);
  if (cal === null) notFound();

  const [calendars, entryOpen] = await Promise.all([
    Promise.all(CALENDARS.map(async (c) => ({ cal: c, cells: await getCalendar(c) }))),
    isEntryOpen(),
  ]);
  const cells = calendars.find((c) => c.cal === cal)!.cells;

  const raw = Number(sp.day);
  const day = Number.isInteger(raw) && raw >= 1 && raw <= 25 ? raw : null;
  const cell = day ? cells.find((c) => c.day === day) : null;

  // 既に埋まっている日が指定されたらカレンダーへ
  if (cell && cell.state !== 'open') redirect(`${homeHref(cal)}${cal === 1 ? '?' : '&'}taken=${day}`);

  const dateLabel = day ? `${calendarPrefix(cal)}12月${day}日（${weekdayJa(day)}）` : '';

  return (
    <>
      <SubHeader cal={cal} />

      <main className="wrap sub-main" style={{ maxWidth: day ? 608 : 760 }}>
        {day ? (
          <>
            <div className="page-head">
              <BoxArt day={day} state="open" size="mini" />
              <div className="page-head-text">
                <p className="page-kicker">
                  RESERVE{CALENDAR_COUNT > 1 && ` · CAL ${cal}`} · DAY {String(day).padStart(2, '0')}
                </p>
                <h1 className="page-title">{dateLabel}の箱を予約する</h1>
              </div>
            </div>
            <EntryForm cal={cal} day={day} dateLabel={dateLabel} entryOpen={entryOpen} />
          </>
        ) : (
          <>
            <p className="page-kicker">RESERVE</p>
            <h1 className="page-title" style={{ marginBottom: 8 }}>空いている日を予約する</h1>
            {!entryOpen && (
              <div role="alert" className="alert">
                現在、予約を受け付けていません
              </div>
            )}
            {/* 日付なしで来たら、全カレンダーの空き日を並べる（1枚目が満員なら2枚目へ誘導） */}
            {calendars.length === 1 ? (
              <DayPicker cells={cells} />
            ) : (
              calendars.map(({ cal: c, cells: cs }) => (
                <section key={c} style={{ marginTop: 32 }} aria-labelledby={`pick-cal-${c}`}>
                  <h2 id={`pick-cal-${c}`} style={{ margin: '0 0 12px', fontSize: 20 }}>
                    {calendarLabel(c)}
                  </h2>
                  <DayPicker cells={cs} cal={c} />
                </section>
              ))
            )}
          </>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
