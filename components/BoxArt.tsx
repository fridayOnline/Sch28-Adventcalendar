import type { SlotState } from '@/types';

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * お菓子アイコン（5種を順番に）。デザイン仕様「published：中は深い赤に、お菓子アイコン」より。
 * scale=1 がカレンダー1マスの大きさ。
 */
export function Sweet({ day, scale = 1 }: { day: number; scale?: number }) {
  const s = (n: number) => Math.round(n * scale);
  switch ((day - 1) % 5) {
    case 0: // キャンディ
      return (
        <svg width={s(44)} height={s(30)} viewBox="0 0 48 32" aria-hidden="true">
          <path d="M11 16L2 7v18zM37 16l9-9v18z" fill="#F3A6B8" />
          <ellipse cx="24" cy="16" rx="14" ry="10" fill="#FBF3E6" />
          <path d="M16 9l6 14M23 7l6 16M30 8l4 10" stroke="#E0526F" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      );
    case 1: // ペロペロキャンディ
      return (
        <svg width={s(30)} height={s(34)} viewBox="0 0 30 36" aria-hidden="true">
          <rect x="13.6" y="20" width="2.8" height="16" rx="1.4" fill="#FBF3E6" />
          <circle cx="15" cy="13" r="12" fill="#FBF3E6" />
          <path d="M15 13m0-3a3 3 0 1 1-3 3a6 6 0 1 1 6-6a9 9 0 1 1-9 9" fill="none" stroke="#3B8FD9" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      );
    case 2: // ハート
      return (
        <svg width={s(34)} height={s(30)} viewBox="0 0 40 36" aria-hidden="true">
          <path d="M20 34C6 24 2 17 5 10c3-6 11-6 15 0c4-6 12-6 15 0c3 7-1 14-15 24z" fill="#E23B45" />
          <path d="M10 11c1-3 4-4 6-3" stroke="#fff" strokeOpacity=".7" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 3: // 星のクッキー
      return (
        <svg width={s(34)} height={s(34)} viewBox="0 0 40 40" aria-hidden="true">
          <path d="M20 3l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#D99A55" stroke="#B5763A" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M20 8l3.5 8 8.5 1-6.5 6 2 8.5-7.5-4.5-7.5 4.5 2-8.5-6.5-6 8.5-1z" fill="none" stroke="#FBF3E6" strokeWidth="1.4" strokeDasharray="2 2" />
          <circle cx="20" cy="21" r="2" fill="#E23B45" />
        </svg>
      );
    default: // キャンディケイン
      return (
        <svg width={s(26)} height={s(34)} viewBox="0 0 26 40" aria-hidden="true">
          <path d="M17 37V13a6 6 0 0 0-12 0" fill="none" stroke="#FBF3E6" strokeWidth="6" strokeLinecap="round" />
          <path d="M17 37V13a6 6 0 0 0-12 0" fill="none" stroke="#E23B45" strokeWidth="6" strokeDasharray="3.5 4.5" />
        </svg>
      );
  }
}

/** 十字の紐に結んだリボン */
export function Bow({ className = 'bow' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 46 26" aria-hidden="true">
      <path d="M23 13C14 2 4 3 5 10s11 5 18 3zm0 0c9-11 19-10 18-3s-11 5-18 3z" fill="none" stroke="#8C6239" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M23 13l-8 11M23 13l8 11" stroke="#8C6239" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="23" cy="13" r="3.2" fill="#8C6239" />
    </svg>
  );
}

/** 今日の箱に乗せるサンタ帽 */
export function SantaHat() {
  return (
    <svg className="hat" viewBox="0 0 50 44" aria-hidden="true">
      <path d="M7 33C11 16 24 5 37 7c6 1 8 8 6 15l-2 11z" fill="#C8252B" />
      <path d="M37 7c4 2 6 7 6 15" stroke="#8E1A1E" strokeWidth="2" fill="none" />
      <rect x="3" y="30" width="42" height="10" rx="5" fill="#FBF3E6" />
      <circle cx="43" cy="22" r="5.5" fill="#FBF3E6" />
    </svg>
  );
}

/**
 * 下層ページ用の装飾の箱（リンクにはしない）。
 *  - big   … 詳細ページの 260px の箱（published はふたが開く）
 *  - mini  … 予約・編集ページ見出し横の 96px の箱
 *  - thumb … スマホのリスト行の 56px の箱
 */
export default function BoxArt({
  day,
  state,
  size,
  authorName,
}: {
  day: number;
  state: SlotState;
  size: 'big' | 'mini' | 'thumb';
  authorName?: string | null;
}) {
  const cls = `sbox sbox-${size} sbox-${state}`;

  if (state === 'published') {
    return (
      <span className={cls} aria-hidden="true">
        <span className="sbox-lid">{size === 'thumb' ? null : pad2(day)}</span>
        <Sweet day={day} scale={size === 'big' ? 2.4 : size === 'mini' ? 1.1 : 0.62} />
      </span>
    );
  }

  return (
    <span className={cls} aria-hidden="true">
      {state === 'reserved' && size === 'big' && <Bow className="sbox-bow" />}
      {state === 'reserved' && size === 'mini' && authorName && <span className="sbox-tag">{authorName}</span>}
      <span className="sbox-num">{day}</span>
    </span>
  );
}
