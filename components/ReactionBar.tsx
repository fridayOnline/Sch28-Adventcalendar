'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import type { EmojiSelection } from '@/components/EmojiPicker';
import { getClientId } from '@/lib/clientId';
import { customKey, QUICK_EMOJI_LABELS } from '@/lib/emoji';
import type { CustomEmoji, ReactionItem } from '@/types';

// ピッカー（絵文字データ込みで重い）は「＋」を押したときに読み込む
const EmojiPicker = dynamic(() => import('@/components/EmojiPicker'), {
  ssr: false,
  loading: () => <p className="picker-loading">読み込み中…</p>,
});

/** 押した瞬間に見た目だけ切り替える（楽観的更新）。サーバーの結果で後から上書きする */
function toggleLocal(list: ReactionItem[], target: ReactionItem): ReactionItem[] {
  const i = list.findIndex((r) => r.key === target.key);
  if (i < 0) return [...list, { ...target, count: 1, mine: true }];
  const cur = list[i];
  const next = { ...cur, mine: !cur.mine, count: Math.max(0, cur.count + (cur.mine ? -1 : 1)) };
  return next.count === 0 ? list.filter((_, j) => j !== i) : list.map((r, j) => (j === i ? next : r));
}

const itemOf = (sel: EmojiSelection): ReactionItem =>
  'custom' in sel
    ? { key: customKey(sel.custom.id), emoji: null, custom: sel.custom, count: 0, mine: false }
    : { key: sel.emoji, emoji: sel.emoji, custom: null, count: 0, mine: false };

export default function ReactionBar({ day, initial }: { day: number; initial: ReactionItem[] }) {
  const [items, setItems] = useState<ReactionItem[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [customs, setCustoms] = useState<CustomEmoji[] | null>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);

  // マウント時に clientId を用意して、自分が押した絵文字（mine）を取りに行く
  useEffect(() => {
    const clientId = getClientId();
    let alive = true;
    fetch(`/api/days/${day}?clientId=${encodeURIComponent(clientId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.reactions) setItems(d.reactions);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [day]);

  // ピッカーを開くたびにカスタム絵文字の一覧を取り直す（他の人が足したものも出す）
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setCustoms(null);
    fetch('/api/emojis')
      .then((r) => (r.ok ? r.json() : { emojis: [] }))
      .then((d) => alive && setCustoms(d.emojis ?? []))
      .catch(() => alive && setCustoms([]));

    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!popRef.current?.contains(t) && !addRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        addRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      alive = false;
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function toggle(target: ReactionItem) {
    if (busy) return;
    const prev = items;
    setItems(toggleLocal(items, target));
    setBusy(target.key);
    setError('');

    try {
      const res = await fetch(`/api/days/${day}/reactions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clientId: getClientId(),
          ...(target.custom ? { customEmojiId: target.custom.id } : { emoji: target.emoji }),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? 'エラーが起きました');
      setItems(data.reactions);
    } catch (e) {
      setItems(prev); // 失敗したら元に戻す
      setError(e instanceof Error ? e.message : 'エラーが起きました');
    } finally {
      setBusy(null);
    }
  }

  function choose(sel: EmojiSelection) {
    setOpen(false);
    const target = itemOf(sel);
    const existing = items.find((r) => r.key === target.key);
    // ピッカーから選んだものは「付ける」操作。すでに自分が押していたら何もしない
    if (existing?.mine) return;
    toggle(existing ?? target);
  }


  return (
    <section aria-label="リアクション" className="reaction-card">
      <div className="rx-list">
        {/* 押されている絵文字だけを、最初に押された順に並べる（件数0のものは出さない） */}
        {items.map((r) => {
          const label = r.custom ? `:${r.custom.name}:` : (QUICK_EMOJI_LABELS[r.key] ?? r.key);
          return (
            <button
              key={r.key}
              type="button"
              className={`rx${r.mine ? ' rx-on' : ''}`}
              aria-pressed={r.mine}
              aria-label={`${label} ${r.count}件`}
              title={label}
              disabled={busy === r.key}
              onClick={() => toggle(r)}
            >
              {r.custom ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="rx-img" src={r.custom.url} alt="" width={22} height={22} />
              ) : (
                <span className="emoji" aria-hidden="true">
                  {r.emoji}
                </span>
              )}
              <span>{r.count}</span>
            </button>
          );
        })}

        <div className="rx-add-wrap">
          <button
            ref={addRef}
            type="button"
            className={`rx rx-add${open ? ' is-open' : ''}`}
            aria-label="ほかの絵文字でリアクション"
            aria-expanded={open}
            aria-haspopup="dialog"
            title="ほかの絵文字・画像の絵文字"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M20.5 11.5A8.5 8.5 0 1 1 12.5 3.5" />
              <path d="M8.5 14.5s1.2 1.8 3.5 1.8 3.5-1.8 3.5-1.8" />
              <path d="M9 9.5h.01M15 9.5h.01" strokeWidth="2.6" />
              <path d="M19 2v5M16.5 4.5h5" />
            </svg>
          </button>

          {open && (
            <div ref={popRef} className="picker-pop" role="dialog" aria-label="絵文字を選ぶ">
              {customs === null ? (
                <p className="picker-loading">読み込み中…</p>
              ) : (
                <EmojiPicker
                  customEmojis={customs}
                  onSelect={choose}
                  onUploaded={(c) => {
                    setCustoms((list) => [...(list ?? []), c]);
                    choose({ custom: c });
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="err" style={{ marginTop: 8 }}>
          {error}
        </p>
      )}
    </section>
  );
}
