import { redirect } from 'next/navigation';
import BoxArt from '@/components/BoxArt';
import DayPicker from '@/components/DayPicker';
import EntryForm from '@/components/EntryForm';
import { SiteFooter, SubHeader } from '@/components/SiteHeader';
import { weekdayJa } from '@/lib/publish';
import { getCalendar, isEntryOpen } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function EntryPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const [cells, entryOpen] = await Promise.all([getCalendar(), isEntryOpen()]);

  const raw = Number((await searchParams).day);
  const day = Number.isInteger(raw) && raw >= 1 && raw <= 25 ? raw : null;
  const cell = day ? cells.find((c) => c.day === day) : null;

  // 既に埋まっている日が指定されたらカレンダーへ
  if (cell && cell.state !== 'open') redirect('/?taken=' + day);

  const dateLabel = day ? `12月${day}日（${weekdayJa(day)}）` : '';

  return (
    <>
      <SubHeader />

      <main className="wrap sub-main" style={{ maxWidth: day ? 608 : 760 }}>
        {day ? (
          <>
            <div className="page-head">
              <BoxArt day={day} state="open" size="mini" />
              <div className="page-head-text">
                <p className="page-kicker">RESERVE · DAY {String(day).padStart(2, '0')}</p>
                <h1 className="page-title">{dateLabel}の箱を予約する</h1>
              </div>
            </div>
            <EntryForm day={day} dateLabel={dateLabel} entryOpen={entryOpen} />
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
            <DayPicker cells={cells} />
          </>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
