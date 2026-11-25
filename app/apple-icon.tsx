import { ImageResponse } from 'next/og';

/**
 * iOS でホーム画面に追加したときのアイコン（apple-touch-icon）。
 * app/icon.svg と同じ絵柄を、角丸なし・余白ありの 180x180 PNG として書き出す。
 * iOS 側で角を丸めてくれるので、背景はアイコン全面に敷く。
 */
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const motif = `<svg xmlns="http://www.w3.org/2000/svg" width="132" height="132" viewBox="0 0 30 30">
  <path d="M15 0v30M0 15h30" stroke="#96701A" stroke-width="1.9"/>
  <path d="M15 15c-5-6-10-5-9-1s6 3 9 1zm0 0c5-6 10-5 9-1s-6 3-9 1z" fill="none" stroke="#96701A" stroke-width="1.6"/>
</svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#C9A57C',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width={132}
          height={132}
          alt=""
          src={`data:image/svg+xml;utf8,${encodeURIComponent(motif)}`}
        />
      </div>
    ),
    size,
  );
}
