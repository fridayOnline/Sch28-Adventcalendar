'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AdminOverview, AdminSlot, SlotState } from '@/types';

const STATE_LABEL: Record<SlotState, string> = {
  open: '募集中',
  reserved: '予約済み',
  published: '公開済み',
};
const STATE_PILL: Record<SlotState, string> = {
  open: 'p-open',
  reserved: 'p-res',
  published: 'p-pub',
};

const formatAt = (iso: string) =>
  new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(iso));

async function call(url: string, init: RequestInit) {
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? 'エラーが起きました');
  }
  return res.status === 204 ? null : res.json();
}

export default function AdminPanel() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [data, setData] = useState<AdminOverview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/admin/overview');
      if (res.status === 401) {
        setLoggedIn(false);
        return;
      }
      if (!res.ok) throw new Error('読み込みに失敗しました');
      setData(await res.json());
      setLoggedIn(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが起きました');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await call('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
      setPassword('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが起きました');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await call('/api/admin/logout', { method: 'POST' }).catch(() => null);
    setLoggedIn(false);
    setData(null);
  }

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが起きました');
    } finally {
      setBusy(false);
    }
  };

  if (!loggedIn) {
    return (
      <main className="wrap" style={{ maxWidth: 420, padding: '80px 24px' }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 24 }}>管理画面</h1>
        <form onSubmit={login} className="form-card">
          <div className="form-row">
            <label htmlFor="apw">管理者パスワード</label>
            <input
              id="apw"
              className="field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {error && (
              <p role="alert" className="err">
                {error}
              </p>
            )}
          </div>
          <button className="btn" type="submit" disabled={busy || !password}>
            ログイン
          </button>
        </form>
      </main>
    );
  }

  if (!data) return <main className="wrap" style={{ padding: 80 }}>読み込み中…</main>;

  const reserved = data.slots.filter((s) => s.state !== 'open' && s.authorName).length;

  const editSlot = (slot: AdminSlot) =>
    run(async () => {
      const authorName = prompt('担当者名', slot.authorName);
      if (authorName === null) return;
      const title = prompt('タイトル（空で未設定）', slot.title ?? '');
      if (title === null) return;
      const url = prompt('URL（空で未設定）', slot.url ?? '');
      if (url === null) return;
      await call(`/api/admin/slots/${slot.day}`, {
        method: 'PATCH',
        body: JSON.stringify({
          authorName: authorName.trim(),
          title: title.trim() || null,
          url: url.trim() || null,
        }),
      });
    });

  return (
    <>
      <header className="admin-header">
        <div className="wrap" style={{ padding: '16px 32px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <p style={{ margin: 0, font: '800 15px/1 var(--font-en)', letterSpacing: '.06em' }}>
            ADVENT CALENDAR <span style={{ color: '#F09A8F' }}>ADMIN</span>
          </p>
          <button
            type="button"
            onClick={logout}
            style={{
              minHeight: 40,
              padding: '0 16px',
              borderRadius: 8,
              border: '1.5px solid rgba(251,243,230,.4)',
              background: 'transparent',
              color: 'var(--paper)',
              font: '700 13px/1 var(--font-ja)',
              cursor: 'pointer',
            }}
          >
            ログアウト
          </button>
        </div>
      </header>

      <main className="wrap" style={{ padding: '40px 32px 80px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {error && (
          <div role="alert" className="alert">
            {error}
          </div>
        )}

        <section style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <div className="card" style={{ flex: '2 1 380px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 17 }}>予約の受付</h2>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-sub)' }}>
                {data.entryOpen ? '受付中 — 誰でも空き枠を予約できます' : '締切 — 予約は 403 になります'}
              </p>
            </div>
            <button
              type="button"
              className="switch"
              role="switch"
              aria-checked={data.entryOpen}
              aria-label="予約の受付"
              disabled={busy}
              style={{ background: data.entryOpen ? 'var(--red-ink)' : '#C9B8A6' }}
              onClick={() =>
                run(() =>
                  call('/api/admin/settings', {
                    method: 'PATCH',
                    body: JSON.stringify({ entryOpen: !data.entryOpen }),
                  }),
                )
              }
            >
              <span className="knob" style={{ left: data.entryOpen ? 30 : 4 }} />
            </button>
          </div>
          <div className="card" style={{ flex: '1 1 160px', background: '#fff' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--ink-muted)' }}>予約済み</p>
            <p style={{ margin: '6px 0 0', font: '800 28px/1 var(--font-en)' }}>
              {reserved}
              <span style={{ fontSize: 14, color: 'var(--ink-muted)' }}> / 25</span>
            </p>
          </div>
          <div className="card" style={{ flex: '1 1 160px', background: '#fff' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--ink-muted)' }}>コメント</p>
            <p style={{ margin: '6px 0 0', font: '800 28px/1 var(--font-en)' }}>
              {data.comments.length}
              <span style={{ fontSize: 14, color: 'var(--ink-muted)' }}> 件</span>
            </p>
          </div>
        </section>

        <section className="card" style={{ background: '#fff', padding: 24 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 18 }}>枠一覧</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>日</th>
                  <th>状態</th>
                  <th>担当</th>
                  <th>タイトル / URL</th>
                  <th>コメント / リアクション</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {data.slots.map((s) => {
                  const empty = s.state === 'open' && !s.authorName;
                  return (
                    <tr key={s.day} className={s.hidden ? 'muted' : ''}>
                      <td style={{ font: '800 16px var(--font-en)', color: 'var(--red-ink)' }}>{s.day}</td>
                      <td>
                        <span className={`pill ${s.hidden ? 'p-hid' : STATE_PILL[s.state]}`}>
                          {s.hidden ? '非表示' : empty ? '募集中' : STATE_LABEL[s.state]}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{s.authorName || '—'}</td>
                      <td style={{ maxWidth: 380 }}>
                        <span style={{ display: 'block', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.title ?? (empty ? '' : '（未登録）')}
                        </span>
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.url ?? ''}
                        </span>
                      </td>
                      <td style={{ font: '600 13px var(--font-en)', whiteSpace: 'nowrap' }}>
                        {empty ? '—' : `${s.commentCount} / ${s.reactionCount}`}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {!empty && (
                          <span style={{ display: 'inline-flex', gap: 6 }}>
                            <button type="button" className="act" disabled={busy} onClick={() => editSlot(s)}>
                              編集
                            </button>
                            <button
                              type="button"
                              className="act"
                              disabled={busy}
                              onClick={() =>
                                run(() =>
                                  call(`/api/admin/slots/${s.day}`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({ hidden: !s.hidden }),
                                  }),
                                )
                              }
                            >
                              {s.hidden ? '再表示' : '非表示'}
                            </button>
                            <button
                              type="button"
                              className="act act-danger"
                              disabled={busy}
                              onClick={() => {
                                if (!confirm(`12月${s.day}日の枠を削除します。コメントとリアクションも消えます。よろしいですか？`)) return;
                                run(() => call(`/api/admin/slots/${s.day}`, { method: 'DELETE' }));
                              }}
                            >
                              削除
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card" style={{ background: '#fff', padding: 24 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 18 }}>コメント（新しい順）</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>日</th>
                  <th>名前</th>
                  <th>本文</th>
                  <th>投稿</th>
                  <th>状態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {data.comments.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ color: 'var(--ink-muted)' }}>
                      まだコメントはありません
                    </td>
                  </tr>
                )}
                {data.comments.map((c) => (
                  <tr key={c.id} className={c.hidden ? 'muted' : ''}>
                    <td style={{ font: '800 15px var(--font-en)', color: 'var(--red-ink)' }}>{c.day}</td>
                    <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{c.name}</td>
                    <td style={{ minWidth: 320, lineHeight: 1.6 }}>{c.body}</td>
                    <td style={{ font: '600 12px var(--font-en)', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                      {formatAt(c.createdAt)}
                    </td>
                    <td>
                      <span className={`pill ${c.hidden ? 'p-hid' : 'p-open'}`}>{c.hidden ? '非表示' : '表示中'}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          className="act"
                          disabled={busy}
                          onClick={() =>
                            run(() =>
                              call(`/api/admin/comments/${c.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ hidden: !c.hidden }),
                              }),
                            )
                          }
                        >
                          {c.hidden ? '再表示' : '非表示'}
                        </button>
                        <button
                          type="button"
                          className="act act-danger"
                          disabled={busy}
                          onClick={() => {
                            if (!confirm('このコメントを削除します。よろしいですか？')) return;
                            run(() => call(`/api/admin/comments/${c.id}`, { method: 'DELETE' }));
                          }}
                        >
                          削除
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
