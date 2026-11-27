import DayCell from '@/components/DayCell';
import { leadingPadCount } from '@/lib/publish';
import type { CalendarCell } from '@/types';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function CalendarGrid({ cells }: { cells: CalendarCell[] }) {
  // 12/1 の曜日に合わせて先頭に空マスを入れる（2026/12/1 は火曜なので2マス）
  const pads = leadingPadCount();

  return (
    <div className="cal">
      {WEEKDAYS.map((w, i) => (
        <span key={w} className={`wk${i === 0 ? ' wk-sun' : ''}`} aria-hidden="true">
          {w}
        </span>
      ))}
      {Array.from({ length: pads }, (_, i) => (
        <div className="pad" key={`pad-${i}`} aria-hidden="true" />
      ))}
      {cells.map((cell) => (
        <DayCell key={`${cell.calendar}-${cell.day}`} cell={cell} />
      ))}
    </div>
  );
}
