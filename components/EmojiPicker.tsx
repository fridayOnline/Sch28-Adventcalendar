'use client';

import data from '@emoji-mart/data';
import ja from '@emoji-mart/data/i18n/ja.json';
import { Picker } from 'emoji-mart';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EMOJI_NAME_RE, EMOJI_UPLOAD_MAX_BYTES, EMOJI_UPLOAD_TYPES } from '@/lib/emoji';
import type { CustomEmoji } from '@/types';

export type EmojiSelection = { emoji: string } | { custom: CustomEmoji };

/**
 * 絵文字ピッカー。タブで切り替える：
 *  - 絵文字   … emoji-mart の Unicode 絵文字（検索・肌の色つき）
 *  - カスタム … アップロードされた画像の絵文字（自前のグリッド）
 * emoji-mart の custom 機能はページ内で一度しか登録できず、新しく追加した絵文字が出ないので使わない。
 * 重いので ReactionBar から「＋」を押したときだけ dynamic import する。
 */
export default function EmojiPicker({
  customEmojis,
  onSelect,
  onUploaded,
}: {
  customEmojis: CustomEmoji[];
  onSelect: (sel: EmojiSelection) => void;
  /** 登録できたら、そのままその絵文字でリアクションする */
  onUploaded: (custom: CustomEmoji) => void;
}) {
  const [tab, setTab] = useState<'emoji' | 'custom' | 'upload'>('emoji');

  if (tab === 'upload') {
    return <UploadForm onCancel={() => setTab('custom')} onUploaded={onUploaded} />;
  }

  return (
    <div className="picker">
      <div className="picker-tabs" role="tablist" aria-label="絵文字の種類">
        <button type="button" role="tab" aria-selected={tab === 'emoji'} className="picker-tab" onClick={() => setTab('emoji')}>
          絵文字
        </button>
        <button type="button" role="tab" aria-selected={tab === 'custom'} className="picker-tab" onClick={() => setTab('custom')}>
          カスタム<span className="picker-tab-count">{customEmojis.length}</span>
        </button>
      </div>

      {tab === 'emoji' ? (
        <MartPicker onEmojiSelect={(e) => e.native && onSelect({ emoji: e.native })} />
      ) : (
        <CustomGrid customEmojis={customEmojis} onPick={(c) => onSelect({ custom: c })} />
      )}

      <button type="button" className="picker-upload-btn" onClick={() => setTab('upload')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="9" cy="9" r="1.8" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        画像から絵文字を追加
      </button>
    </div>
  );
}

/**
 * emoji-mart のピッカー（Web Component）を div の中に置く。
 * @emoji-mart/react は React 19 に対応していないので、同じことを自前でしている。
 */
function MartPicker({ onEmojiSelect }: { onEmojiSelect: (e: { native?: string }) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onEmojiSelect);
  onSelectRef.current = onEmojiSelect;

  useEffect(() => {
    const parent = ref.current;
    if (!parent) return;
    const picker = new Picker({
      data,
      i18n: ja,
      locale: 'ja',
      theme: 'light',
      set: 'native',
      previewPosition: 'none',
      skinTonePosition: 'search',
      navPosition: 'top',
      maxFrequentRows: 2,
      perLine: 8,
      emojiSize: 22,
      emojiButtonSize: 34,
      dynamicWidth: true,
      autoFocus: true,
      onEmojiSelect: (e: { native?: string }) => onSelectRef.current(e),
      parent,
    } as ConstructorParameters<typeof Picker>[0]);
    // 開発時の React は effect を2回動かすので、外すときは必ず消す
    return () => {
      (picker as unknown as HTMLElement).remove();
    };
  }, []);

  return <div ref={ref} className="mart-picker" />;
}

/** カスタム絵文字の一覧（名前で絞り込み） */
function CustomGrid({ customEmojis, onPick }: { customEmojis: CustomEmoji[]; onPick: (c: CustomEmoji) => void }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase().replace(/:/g, '');
  const shown = useMemo(
    () => (query ? customEmojis.filter((c) => c.name.includes(query)) : customEmojis),
    [customEmojis, query],
  );

  return (
    <div className="custom-grid-wrap">
      <input
        className="field custom-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="名前でさがす"
        aria-label="カスタム絵文字を名前でさがす"
        autoFocus
      />
      {shown.length === 0 ? (
        <p className="custom-empty">
          {customEmojis.length === 0 ? 'まだカスタム絵文字はありません。下のボタンから画像で作れます' : '見つかりませんでした'}
        </p>
      ) : (
        <ul className="custom-grid">
          {shown.map((c) => (
            <li key={c.id}>
              <button type="button" className="custom-cell" title={`:${c.name}:`} aria-label={`:${c.name}:`} onClick={() => onPick(c)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.url} alt="" width={28} height={28} loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** ファイル名から絵文字名の候補を作る（例: "Party Parrot.gif" → "party-parrot"） */
const nameFromFile = (fileName: string) =>
  fileName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

function UploadForm({
  onCancel,
  onUploaded,
}: {
  onCancel: () => void;
  onUploaded: (custom: CustomEmoji) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(f: File | undefined) {
    setError('');
    if (!f) return;
    if (!(EMOJI_UPLOAD_TYPES as readonly string[]).includes(f.type)) {
      setError('PNG・JPEG・GIF・WebP の画像を選んでください');
      return;
    }
    if (f.size > EMOJI_UPLOAD_MAX_BYTES) {
      setError('画像は256KBまでです');
      return;
    }
    setFile(f);
    if (!name) setName(nameFromFile(f.name));
  }

  const nameOk = EMOJI_NAME_RE.test(name);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !nameOk || sending) return;
    setSending(true);
    setError('');
    try {
      const body = new FormData();
      body.set('name', name);
      body.set('file', file);
      const res = await fetch('/api/emojis', { method: 'POST', body });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? 'エラーが起きました');
      onUploaded(json as CustomEmoji);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが起きました');
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="emoji-upload" onSubmit={submit}>
      <p className="emoji-upload-title">画像から絵文字を追加</p>

      <div className="emoji-upload-row">
        <button type="button" className="emoji-drop" onClick={() => fileRef.current?.click()} aria-label="画像を選ぶ">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" width={64} height={64} />
          ) : (
            <span>画像を選ぶ</span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={EMOJI_UPLOAD_TYPES.join(',')}
          hidden
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <div className="form-row emoji-upload-name">
          <label htmlFor="emoji-name">名前</label>
          <div className="emoji-name-field">
            <span aria-hidden="true">:</span>
            <input
              id="emoji-name"
              className="field"
              value={name}
              maxLength={32}
              onChange={(e) => setName(e.target.value.toLowerCase())}
              placeholder="party-parrot"
              autoComplete="off"
              spellCheck={false}
            />
            <span aria-hidden="true">:</span>
          </div>
        </div>
      </div>

      <p className="hint">
        PNG・JPEG・GIF・WebP（256KBまで）。128×128 に縮めて保存します。名前は半角英小文字・数字・_ - だけ。
        登録した絵文字はみんなが使えます。
      </p>
      {name && !nameOk && <p className="err">名前は半角英小文字・数字・_ - の32文字までです</p>}
      {error && (
        <p role="alert" className="err">
          {error}
        </p>
      )}

      <div className="emoji-upload-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          もどる
        </button>
        <button type="submit" className="btn btn-sm" disabled={!file || !nameOk || sending}>
          {sending ? '登録中…' : '登録してリアクション'}
        </button>
      </div>
    </form>
  );
}
