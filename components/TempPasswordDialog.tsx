'use client';

import { useEffect, useRef, useState } from 'react';

export type IssuedPassword = { day: number; authorName: string; tempPassword: string };

/**
 * 管理画面で再発行した仮パスワードを 1 回だけ見せるダイアログ。
 * 閉じると state ごと消えて、二度と表示できない（サーバーにもハッシュしか残らない）。
 */
export default function TempPasswordDialog({
  issued,
  onClose,
}: {
  issued: IssuedPassword | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (issued && !dlg.open) {
      setCopied(false);
      dlg.showModal();
    }
    if (!issued && dlg.open) dlg.close();
  }, [issued]);

  async function copy() {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.tempPassword);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <dialog ref={ref} className="pw-dialog" aria-labelledby="pw-dialog-title" onClose={onClose}>
      {issued && (
        <>
          <h2 id="pw-dialog-title" className="pw-dialog-title">
            12月{issued.day}日（{issued.authorName}）の仮パスワード
          </h2>
          <p className="pw-dialog-text">
            古いパスワードはもう使えません。下の仮パスワードを本人に伝えてください。
          </p>
          <div className="pw-box">
            <code className="pw-value">{issued.tempPassword}</code>
            <button type="button" className="act" onClick={copy}>
              {copied ? 'コピーしました' : 'コピー'}
            </button>
          </div>
          <ul className="pw-dialog-notes">
            <li>この画面を閉じると、仮パスワードは二度と表示できません。</li>
            <li>本人には、編集画面の「パスワードを変更する」で自分のパスワードに変えてもらってください。</li>
          </ul>
          <form method="dialog" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-sm" type="submit">
              伝えたので閉じる
            </button>
          </form>
        </>
      )}
    </dialog>
  );
}
