'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Unlocked = { authorName: string; title: string | null; url: string | null };

export default function EditForm({ day }: { day: number }) {
  const router = useRouter();
  // パスワードはメモリにだけ持ち、保存しない
  const [pw, setPw] = useState('');
  const [slot, setSlot] = useState<Unlocked | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (!pw || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/slots/${day}/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ editPassword: pw }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? 'エラーが起きました');
      setSlot(data);
      setTitle(data.title ?? '');
      setUrl(data.url ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが起きました');
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`/api/slots/${day}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ editPassword: pw, title: title.trim(), url: url.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? 'エラーが起きました');
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが起きました');
    } finally {
      setBusy(false);
    }
  }

  async function cancelReservation() {
    if (!confirm(`12月${day}日の予約を取り消します。よろしいですか？`)) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/slots/${day}`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ editPassword: pw }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? 'エラーが起きました');
      }
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが起きました');
      setBusy(false);
    }
  }

  if (!slot) {
    return (
      <form onSubmit={unlock} className="form-card" style={{ gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8C6239" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>予約したときのパスワードで箱を開けます</p>
        </div>
        <div className="form-row">
          <label htmlFor="upw">編集用パスワード</label>
          <input
            id="upw"
            className="field"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error && (
            <p role="alert" className="err">
              {error}
            </p>
          )}
        </div>
        <button className="btn" type="submit" disabled={!pw || busy}>
          {busy ? '確認しています…' : 'ロックを解除'}
        </button>
      </form>
    );
  }

  return (
    <>
      <form onSubmit={save} className="form-card">
        <div className="form-row">
          <label htmlFor="ttl">記事タイトル</label>
          <input
            id="ttl"
            className="field"
            type="text"
            maxLength={100}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaved(false);
            }}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="url">記事URL</label>
          <input
            id="url"
            className="field"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setSaved(false);
            }}
            placeholder="https://"
            required
          />
          <p className="hint">http:// か https:// で始まるURLのみ。公開日の0時まではカレンダーに出ません</p>
        </div>
        {error && (
          <p role="alert" className="err">
            {error}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button className="btn" type="submit" disabled={busy}>
            保存する
          </button>
          {saved && (
            <span role="status" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: '#2F6B3A' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12l5 5 9-10" />
              </svg>
              保存しました
            </span>
          )}
        </div>
      </form>

      <section
        style={{
          marginTop: 28,
          padding: '24px 32px',
          borderRadius: 18,
          border: '2px dashed #D9A9A2',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ flex: '1 1 260px' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 16 }}>予約を取り消す</h2>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: 'var(--ink-sub)' }}>
            この日を「募集中」に戻します。公開後は取り消せないので、管理者に連絡してください。
          </p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={cancelReservation} disabled={busy} style={{ minHeight: 48 }}>
          取り消す
        </button>
      </section>
    </>
  );
}
