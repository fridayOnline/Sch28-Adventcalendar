'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ArticleForm from '@/components/ArticleForm';
import BoxArt from '@/components/BoxArt';

export default function EntryForm({
  day,
  dateLabel,
  entryOpen,
}: {
  day: number;
  dateLabel: string;
  entryOpen: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const mismatch = pw2.length > 0 && pw !== pw2;
  const cannotSend = !name.trim() || pw.length < 4 || pw !== pw2 || sending || !entryOpen;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (cannotSend) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`/api/slots/${day}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ authorName: name.trim(), editPassword: pw }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? 'エラーが起きました');
      }
      // ここで router.refresh() すると、埋まった日の /entry はカレンダーへ飛ばされるので呼ばない
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが起きました');
    } finally {
      setSending(false);
    }
  }

  // 予約できたら、同じパスワードのまま記事タイトルとURLを登録してもらい、保存できたらカレンダーへ戻る
  if (done) {
    return (
      <>
        <ol className="form-steps" aria-label="予約の手順">
          <li className="step-done">
            <span className="step-no" aria-hidden="true">✓</span>名前とパスワード
          </li>
          <li className="step-now" aria-current="step">
            <span className="step-no" aria-hidden="true">2</span>記事タイトルとURL
          </li>
        </ol>

        <div role="status" className="reserved-note">
          <BoxArt day={day} state="reserved" size="thumb" />
          <div>
            <p className="reserved-note-title">{dateLabel}を予約しました</p>
            <p className="reserved-note-text">
              パスワードはあとから記事を直すときに使います。控えておいてください（あとから確認できません）。
            </p>
          </div>
        </div>

        <ArticleForm
          day={day}
          editPassword={pw}
          submitLabel="保存してカレンダーへ戻る"
          leaveAfterSave
          onSaved={() => {
            router.push('/');
            router.refresh();
          }}
          secondary={
            <Link className="text-link" href="/">
              記事がまだなら、あとで登録する
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      {!entryOpen && (
        <div role="alert" className="alert">
          現在、予約を受け付けていません
        </div>
      )}
      {error && (
        <div role="alert" className="alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v6M12 17h.01" />
          </svg>
          {error} <Link href="/">ほかの日を選ぶ</Link>
        </div>
      )}

      <form onSubmit={submit} className="form-card">
        <div className="form-row">
          <label htmlFor="ename">名前（カレンダーに表示されます）</label>
          <input
            id="ename"
            className="field"
            type="text"
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：yuta"
            disabled={!entryOpen}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="epw">編集用パスワード</label>
          <input
            id="epw"
            className="field"
            type="password"
            minLength={4}
            maxLength={64}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="new-password"
            disabled={!entryOpen}
            required
          />
          <p className="hint">4文字以上。記事URLの登録・予約の取り消しに使います</p>
        </div>
        <div className="form-row">
          <label htmlFor="epw2">パスワード（確認）</label>
          <input
            id="epw2"
            className={`field${mismatch ? ' field-err' : ''}`}
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            autoComplete="new-password"
            disabled={!entryOpen}
            required
          />
          {mismatch && <p className="err">パスワードが一致していません</p>}
        </div>
        <button className="btn" type="submit" disabled={cannotSend} style={{ marginTop: 6 }}>
          {sending ? '予約しています…' : 'この日を予約する'}
        </button>
      </form>
    </>
  );
}
