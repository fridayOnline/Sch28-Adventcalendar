'use client';

import { useState, type ReactNode } from 'react';
import { withCal } from '@/lib/calendars';

/**
 * 記事タイトルと記事URLの入力・保存（PUT /api/slots/[day]）。
 * 予約直後の画面（EntryForm）と編集画面（EditForm）の両方で使う。
 * - leaveAfterSave：保存できたら onSaved を呼んで、画面が切り替わるまでボタンを押せないままにする（予約直後→カレンダーへ）
 * - それ以外：その場に「保存しました」を出してから onSaved を呼ぶ（編集画面）
 */
export default function ArticleForm({
  cal,
  day,
  editPassword,
  initialTitle = '',
  initialUrl = '',
  submitLabel = '保存する',
  onSaved,
  leaveAfterSave = false,
  secondary,
}: {
  cal: number;
  day: number;
  /** 予約・ロック解除のときに入力したパスワード。メモリにだけ持つ */
  editPassword: string;
  initialTitle?: string;
  initialUrl?: string;
  submitLabel?: string;
  onSaved?: () => void;
  leaveAfterSave?: boolean;
  /** 保存ボタンの横に置くもの（「あとで登録する」など） */
  secondary?: ReactNode;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(withCal(`/api/slots/${day}`, cal), {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ editPassword, title: title.trim(), url: url.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? 'エラーが起きました');
      onSaved?.();
      if (leaveAfterSave) return; // 画面が切り替わるまでボタンは押せないままにする
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが起きました');
    }
    setBusy(false);
  }

  return (
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
          placeholder="例：近所のパン屋を全部まわった話"
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
        <p className="hint">http:// か https:// で始まるURLのみ。公開日の朝6時まではカレンダーに出ません</p>
      </div>
      {error && (
        <p role="alert" className="err">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn" type="submit" disabled={busy || !title.trim() || !url.trim()}>
          {busy ? '保存しています…' : submitLabel}
        </button>
        {saved && (
          <span role="status" className="saved-note">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12l5 5 9-10" />
            </svg>
            保存しました
          </span>
        )}
        {secondary}
      </div>
    </form>
  );
}
