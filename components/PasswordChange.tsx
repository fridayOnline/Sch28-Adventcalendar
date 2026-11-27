'use client';

import { useState } from 'react';
import { withCal } from '@/lib/calendars';

/**
 * /edit のロック解除後に出す「パスワードを変更する」。
 * 管理者から仮パスワードをもらった人が、自分だけが知っているパスワードに変えるためのもの。
 * 変更できたら onChanged で新しいパスワードを親に返す（そのまま保存・取り消しを続けられるように）。
 */
export default function PasswordChange({
  cal,
  day,
  currentPassword,
  onChanged,
}: {
  cal: number;
  day: number;
  currentPassword: string;
  onChanged: (newPassword: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const mismatch = pw2.length > 0 && pw !== pw2;
  const cannotSend = pw.length < 4 || pw !== pw2 || busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (cannotSend) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(withCal(`/api/slots/${day}/password`, cal), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ editPassword: currentPassword, newPassword: pw }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? 'エラーが起きました');
      }
      onChanged(pw);
      setPw('');
      setPw2('');
      setOpen(false);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが起きました');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="pw-change">
      <div className="pw-change-head">
        <div style={{ flex: '1 1 260px' }}>
          <h2 className="pw-change-title">パスワードを変更する</h2>
          <p className="pw-change-text">
            メンターから仮パスワードをもらった人は、ここで自分のパスワードに変えてください。
          </p>
        </div>
        {!open && (
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setOpen(true);
              setDone(false);
            }}
            style={{ minHeight: 48 }}
          >
            変更する
          </button>
        )}
      </div>

      {done && (
        <p role="status" className="saved-note" style={{ marginTop: 12 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12l5 5 9-10" />
          </svg>
          パスワードを変更しました。次からは新しいパスワードで開いてください
        </p>
      )}

      {open && (
        <form onSubmit={submit} className="pw-change-form">
          <div className="form-row">
            <label htmlFor="npw">新しいパスワード</label>
            <input
              id="npw"
              className="field"
              type="password"
              minLength={4}
              maxLength={64}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="new-password"
              required
            />
            <p className="hint">4文字以上</p>
          </div>
          <div className="form-row">
            <label htmlFor="npw2">新しいパスワード（確認）</label>
            <input
              id="npw2"
              className={`field${mismatch ? ' field-err' : ''}`}
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              autoComplete="new-password"
              required
            />
            {mismatch && <p className="err">パスワードが一致していません</p>}
          </div>
          {error && (
            <p role="alert" className="err">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button className="btn" type="submit" disabled={cannotSend}>
              {busy ? '変更しています…' : 'パスワードを変更'}
            </button>
            <button
              type="button"
              className="text-link"
              style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit', fontSize: 13, fontWeight: 700 }}
              onClick={() => {
                setOpen(false);
                setPw('');
                setPw2('');
                setError('');
              }}
            >
              やめる
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
