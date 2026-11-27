'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ArticleForm from '@/components/ArticleForm';
import PasswordChange from '@/components/PasswordChange';
import { homeHref, withCal } from '@/lib/calendars';

type Unlocked = { authorName: string; title: string | null; url: string | null };

export default function EditForm({ cal, day, dateLabel }: { cal: number; day: number; dateLabel: string }) {
  const router = useRouter();
  // パスワードはメモリにだけ持ち、保存しない
  const [pw, setPw] = useState('');
  const [slot, setSlot] = useState<Unlocked | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (!pw || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(withCal(`/api/slots/${day}/verify`, cal), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ editPassword: pw }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? 'エラーが起きました');
      setSlot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが起きました');
    } finally {
      setBusy(false);
    }
  }

  async function cancelReservation() {
    if (!confirm(`${dateLabel}の予約を取り消します。よろしいですか？`)) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(withCal(`/api/slots/${day}`, cal), {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ editPassword: pw }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? 'エラーが起きました');
      }
      router.push(homeHref(cal));
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
        <p className="hint" style={{ margin: 0, textAlign: 'center', fontSize: 13 }}>
          パスワードを忘れた場合は、メンターに言ってね！
        </p>
      </form>
    );
  }

  return (
    <>
      <ArticleForm
        cal={cal}
        day={day}
        editPassword={pw}
        initialTitle={slot.title ?? ''}
        initialUrl={slot.url ?? ''}
        onSaved={() => router.refresh()}
      />

      <PasswordChange cal={cal} day={day} currentPassword={pw} onChanged={setPw} />
      {error && (
        <p role="alert" className="err" style={{ marginTop: 16 }}>
          {error}
        </p>
      )}

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
