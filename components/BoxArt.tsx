import type { SlotState } from '@/types';

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * お菓子の絵。public/assets/sweet_NN.png（240x240 キャンバスの中央にお菓子）を使い、
 * CSS（.sweet-img）でお菓子の部分だけを切り出して表示する。大きさは親の高さに合わせる。
 */
export function Sweet({ day }: { day: number }) {
  return (
    <span className="sweet-img" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/assets/sweet_${pad2(day)}.png`} alt="" width={240} height={240} decoding="async" />
    </span>
  );
}

/** 十字の紐に結んだリボン */
export function Bow({ className = 'bow' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 46 26" aria-hidden="true">
      <path d="M23 13C14 2 4 3 5 10s11 5 18 3zm0 0c9-11 19-10 18-3s-11 5-18 3z" fill="none" stroke="#96701A" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M23 13l-8 11M23 13l8 11" stroke="#96701A" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="23" cy="13" r="3.2" fill="#96701A" />
    </svg>
  );
}

/**
 * 公開済みの箱の扉（AE の Flap Front / Flap Back と Twine にあたる）。
 * 閉じた状態＝予約済みの箱と同じ見た目で始まり、CSS アニメーションで
 * 紐がほどける → 扉が上辺を軸に手前へ開く（表→裏に切り替わる）→ お菓子が飛び出す。
 * 開始タイミングは親の CSS 変数 --o（秒）で決める。
 */
export function Flap({ day }: { day: number }) {
  return (
    <span className="flap" aria-hidden="true">
      <span className="flap-face flap-front">
        <span className="tw tw-t" />
        <span className="tw tw-b" />
        <span className="tw tw-l" />
        <span className="tw tw-r" />
        <span className="flap-bow">
          <Bow className="flap-bow-svg" />
        </span>
        <span className="flap-num">{pad2(day)}</span>
      </span>
      <span className="flap-face flap-back">
        <span className="flap-back-num">{pad2(day)}</span>
      </span>
    </span>
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
 *  - big   … 詳細ページの 260px の箱（published は開くアニメーション付き）
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
      <span className={`${cls} opener`} aria-hidden="true">
        <Sweet day={day} />
        <Flap day={day} />
      </span>
    );
  }

  return (
    <span className={cls} aria-hidden="true">
      {state === 'reserved' && size === 'big' && <Bow className="sbox-bow" />}
      {state === 'reserved' && size === 'mini' && authorName && <span className="sbox-tag">{authorName}</span>}
      <span className="sbox-num">{pad2(day)}</span>
    </span>
  );
}
