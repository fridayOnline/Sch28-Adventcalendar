import type { MetadataRoute } from 'next';
import { eventYear } from '@/lib/publish';

/**
 * Android などでホーム画面に追加したときの表示。アイコンは app/icon.svg と
 * app/apple-icon.tsx（180x180 PNG）をそのまま使う。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `FriOn Advent Calendar ${eventYear()}`,
    short_name: 'Advent Calendar',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F0EA',
    theme_color: '#A8191F',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
  };
}
