'use client';

import { useEffect, useRef, useState } from 'react';
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
  const listRef = useRef<HTMLDivElement>(null);

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
      // 新しい順なので、投稿したコメントが見えるよう一覧を先頭までスクロール
      listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      saveName(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが起きました');
    } finally {
      setSending(false);
    }
  }

  return (
    <section aria-labelledby="comments-title" className="comments">
      <h2 id="comments-title" className="comments-title">
        コメント <span>{comments.length}</span>
      </h2>

      {/* 投稿済みのコメント（新しい順）。たまってもページが伸びないよう、この枠の中だけスクロールする */}
      <div
        ref={listRef}
        className="comment-scroll"
        role="region"
        aria-label="コメント一覧"
        tabIndex={0}
      >
        {comments.length === 0 ? (
          <p className="comment-empty">まだコメントはありません。最初のひとことをどうぞ</p>
        ) : (
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
        )}
      </div>

      {/* 一覧の下に投稿フォーム */}
      <form onSubmit={submit} className="form-card comment-form">
        <div className="form-row comment-name">
          <label htmlFor="cname">
            名前<span className="label-note">（任意）</span>
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
        <div className="comment-actions">
          <span className={`comment-remain${remain < 20 ? ' is-low' : ''}`}>残り {remain} 文字</span>
          <button className="btn" type="submit" disabled={!body.trim() || sending} style={{ minHeight: 48 }}>
            {sending ? '送信中…' : '送信する'}
          </button>
        </div>
      </form>
    </section>
  );
}
