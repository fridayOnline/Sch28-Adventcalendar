/**
 * 「カレンダーの表示が古くなった」印（ブラウザ専用）。
 * 予約・記事の保存・取り消し・コメント・リアクションのあとに付けておき、カレンダーを表示したときに見て取り直す。
 * ブラウザの「戻る」でカレンダーに戻ると、Next.js が前に見たときの画面をそのまま出すので、これが無いと古いままになる。
 * タブを閉じれば消えればよいので sessionStorage に置く。
 */
const KEY = 'advent:calendarStale';

export function markCalendarStale() {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    // 使えない環境では何もしない（「カレンダーに戻る」リンクは自分で取り直す）
  }
}

/** 印が付いていたら消して true を返す */
export function takeCalendarStale(): boolean {
  try {
    const stale = sessionStorage.getItem(KEY) === '1';
    if (stale) sessionStorage.removeItem(KEY);
    return stale;
  } catch {
    return false;
  }
}
