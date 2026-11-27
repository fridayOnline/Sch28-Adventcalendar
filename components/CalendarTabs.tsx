'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useLayoutEffect, useState, type ReactNode } from 'react';
import { calendarLabel, homeHref, parseCalParam } from '@/lib/calendars';

export type CalendarPanel = {
  cal: number;
  /** 空き枠の数（タブの横に「空き N」「満員」と出す） */
  openCount: number;
  content: ReactNode;
};

/** <html data-cal="N">。どのタブを見せるかは CSS がこれを見て決める */
const setHtmlCal = (cal: number) => {
  document.documentElement.dataset.cal = String(cal);
};

/** タブ・パネルの表示切り替え。React の state ではなく <html data-cal> を見るので、JS が動く前から正しい */
function tabCss(cals: number[]) {
  const html = (c: number) => (c === 1 ? ['html:not([data-cal])', 'html[data-cal="1"]'] : [`html[data-cal="${c}"]`]);
  const each = (fn: (c: number, h: string) => string) => cals.flatMap((c) => html(c).map((h) => fn(c, h))).join(',');
  return [
    `${each((c, h) => `${h} .cal-panel:not([data-cal-panel="${c}"])`)}{display:none}`,
    `${each((c, h) => `${h} .cal-tab[data-cal-tab="${c}"]`)}{background:var(--red-ink);border-color:var(--red-ink);color:var(--paper)}`,
    `${each((c, h) => `${h} .cal-tab[data-cal-tab="${c}"] .cal-tab-count`)}{background:rgba(251,243,230,.2);color:var(--paper)}`,
  ].join('\n');
}

/** URL の ?cal= を読んで反映する（useSearchParams は Suspense の中で使う）。描画前に合わせるので layout effect */
function CalFromUrl({ onChange }: { onChange: (cal: number) => void }) {
  const cal = parseCalParam(useSearchParams().get('cal')) ?? 1;
  useLayoutEffect(() => {
    setHtmlCal(cal);
    onChange(cal);
  }, [cal, onChange]);
  return null;
}

/**
 * トップの「カレンダー1｜カレンダー2」タブ。
 * どちらのカレンダーもサーバーで描いておき、ここでは表示を切り替えるだけ（/ は静的生成のまま）。
 * 選んだタブは /?cal=2 のように URL に残すので、共有・リロード・戻るボタンでも同じタブが開く。
 * 見た目は <html data-cal> と CSS で切り替え、React の state はキーボード操作と aria 属性のためだけに持つ。
 */
export default function CalendarTabs({ panels }: { panels: CalendarPanel[] }) {
  const [active, setActive] = useState(1);

  const select = (cal: number) => {
    setHtmlCal(cal);
    setActive(cal);
    window.history.replaceState(window.history.state, '', homeHref(cal) + '#calendar');
  };

  return (
    <>
      <style>{tabCss(panels.map((p) => p.cal))}</style>
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
            data-cal-tab={p.cal}
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
          className="cal-panel"
          data-cal-panel={p.cal}
          aria-labelledby={`cal-tab-${p.cal}`}
        >
          {p.content}
        </div>
      ))}
    </>
  );
}
