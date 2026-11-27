'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { calendarLabel, homeHref, parseCalParam } from '@/lib/calendars';

export type CalendarPanel = {
  cal: number;
  /** 空き枠の数（タブの横に「空き N」「満員」と出す） */
  openCount: number;
  content: ReactNode;
};

/** URL の ?cal= を読んで親に伝えるだけ（useSearchParams は Suspense の中で使う） */
function CalFromUrl({ onChange }: { onChange: (cal: number) => void }) {
  const cal = parseCalParam(useSearchParams().get('cal')) ?? 1;
  useEffect(() => onChange(cal), [cal, onChange]);
  return null;
}

/**
 * トップの「カレンダー1｜カレンダー2」タブ。
 * どちらのカレンダーもサーバーで描いておき、ここでは表示を切り替えるだけ（/ は静的生成のまま）。
 * 選んだタブは /?cal=2 のように URL に残すので、共有・戻るボタンでも同じタブが開く。
 */
export default function CalendarTabs({ panels }: { panels: CalendarPanel[] }) {
  const [active, setActive] = useState(1);

  const select = (cal: number) => {
    setActive(cal);
    window.history.replaceState(null, '', homeHref(cal) + '#calendar');
  };

  return (
    <>
      <Suspense fallback={null}>
        <CalFromUrl onChange={setActive} />
      </Suspense>

      <div className="cal-tabs" role="tablist" aria-label="カレンダーを選ぶ">
        {panels.map((p) => (
          <button
            key={p.cal}
            type="button"
            role="tab"
            id={`cal-tab-${p.cal}`}
            aria-selected={active === p.cal}
            aria-controls={`cal-panel-${p.cal}`}
            tabIndex={active === p.cal ? 0 : -1}
            className="cal-tab"
            onClick={() => select(p.cal)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              const i = panels.findIndex((x) => x.cal === p.cal);
              const next = panels[(i + (e.key === 'ArrowRight' ? 1 : panels.length - 1)) % panels.length];
              select(next.cal);
              document.getElementById(`cal-tab-${next.cal}`)?.focus();
            }}
          >
            {calendarLabel(p.cal)}
            <span className={`cal-tab-count${p.openCount === 0 ? ' is-full' : ''}`}>
              {p.openCount === 0 ? '満員' : `空き ${p.openCount}`}
            </span>
          </button>
        ))}
      </div>

      {panels.map((p) => (
        <div
          key={p.cal}
          role="tabpanel"
          id={`cal-panel-${p.cal}`}
          aria-labelledby={`cal-tab-${p.cal}`}
          hidden={active !== p.cal}
        >
          {p.content}
        </div>
      ))}
    </>
  );
}
