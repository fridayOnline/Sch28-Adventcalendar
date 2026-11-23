'use client';

import { useEffect, useState } from 'react';
import { getClientId } from '@/lib/clientId';
import { EMOJIS, EMOJI_LABELS, type Emoji, type ReactionCounts } from '@/types';

export default function ReactionBar({
  day,
  initial,
}: {
  day: number;
  initial: ReactionCounts;
}) {
  const [counts, setCounts] = useState<ReactionCounts>(initial);
  const [mine, setMine] = useState<Emoji[]>([]);
  const [busy, setBusy] = useState<Emoji | null>(null);
  const [error, setError] = useState('');

  // マウント時に clientId を用意して、自分が押した絵文字を取りに行く
  useEffect(() => {
    const clientId = getClientId();
    let alive = true;
    fetch(`/api/days/${day}?clientId=${encodeURIComponent(clientId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d) return;
        setCounts(d.reactions);
        setMine(d.myReactions);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [day]);

  async function toggle(emoji: Emoji) {
    if (busy) return;
    const on = mine.includes(emoji);

    // 楽観的更新：押した瞬間に±1して見せる
    const prevCounts = counts;
    const prevMine = mine;
    setCounts({ ...counts, [emoji]: Math.max(0, counts[emoji] + (on ? -1 : 1)) });
    setMine(on ? mine.filter((e) => e !== emoji) : [...mine, emoji]);
    setBusy(emoji);
    setError('');

    try {
      const res = await fetch(`/api/days/${day}/reactions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ emoji, clientId: getClientId() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? 'エラーが起きました');
      }
      const data = await res.json();
      setCounts(data.reactions);
      setMine(data.myReactions);
    } catch (e) {
      // 失敗したら元に戻す
      setCounts(prevCounts);
      setMine(prevMine);
      setError(e instanceof Error ? e.message : 'エラーが起きました');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-label="リアクション" style={{ marginTop: 72, padding: 28, borderRadius: 16, background: 'rgba(251,243,230,.8)' }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 16 }}>リアクション</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {EMOJIS.map((emoji) => {
          const on = mine.includes(emoji);
          return (
            <button
              key={emoji}
              type="button"
              className={`rx${on ? ' rx-on' : ''}`}
              aria-pressed={on}
              aria-label={`${EMOJI_LABELS[emoji]} ${counts[emoji]}件`}
              disabled={busy === emoji}
              onClick={() => toggle(emoji)}
            >
              <span className="emoji" aria-hidden="true">
                {emoji}
              </span>
              <span>{counts[emoji]}</span>
            </button>
          );
        })}
      </div>
      <p className="hint" style={{ marginTop: 12 }}>同じ絵文字をもう一度押すと取り消せます</p>
      {error && (
        <p role="alert" className="err" style={{ marginTop: 8 }}>
          {error}
        </p>
      )}
    </section>
  );
}
