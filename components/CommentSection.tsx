'use client';

import { useEffect, useState } from 'react';
import { getSavedName, saveName } from '@/lib/clientId';
import type { Comment } from '@/types';

const MAX = 280;

const formatAt = (iso: string) => {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(d);
};

export default function CommentSection({
  day,
  initial,
}: {
  day: number;
  initial: Comment[];
}) {
  const [comments, setComments] = useState<Comment[]>(initial);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(getSavedName());
  }, []);

  const remain = MAX - body.length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`/api/days/${day}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), body: body.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? 'エラーが起きました');

      setComments([data as Comment, ...comments]);
      setBody('');
      saveName(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが起きました');
    } finally {
      setSending(false);
    }
  }

  return (
    <section aria-label="コメント" style={{ marginTop: 40 }}>
      <h2 style={{ margin: '0 0 18px', fontSize: 22 }}>
        コメント <span style={{ font: '700 16px var(--font-en)', color: 'var(--ink-muted)' }}>{comments.length}</span>
      </h2>

      <form onSubmit={submit} className="form-card" style={{ padding: 24, borderRadius: 16, gap: 14 }}>
        <div className="form-row" style={{ maxWidth: 280 }}>
          <label htmlFor="cname">
            名前<span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>（任意・空なら「名無し」）</span>
          </label>
          <input
            id="cname"
            className="field"
            type="text"
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名無し"
          />
        </div>
        <div className="form-row">
          <label htmlFor="cbody">コメント</label>
          <textarea
            id="cbody"
            className="field"
            rows={3}
            maxLength={MAX}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="感想をどうぞ"
            style={{ resize: 'vertical' }}
          />
        </div>
        {error && (
          <p role="alert" className="err">
            {error}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ font: '700 13px/1 var(--font-en)', color: remain < 20 ? 'var(--red-ink)' : 'var(--ink-muted)' }}>
            残り {remain} 文字
          </span>
          <button className="btn" type="submit" disabled={!body.trim() || sending} style={{ minHeight: 48 }}>
            {sending ? '送信中…' : '送信する'}
          </button>
        </div>
      </form>

      <ul className="comment-list">
        {comments.map((c) => (
          <li key={c.id}>
            <p className="comment-head">
              <b>{c.name}</b>
              <time dateTime={c.createdAt}>{formatAt(c.createdAt)}</time>
            </p>
            {/* React のテキストとして出すだけ。HTMLとしては解釈しない */}
            <p className="comment-body">{c.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
