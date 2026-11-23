import { currentTime } from '@/lib/publish';
import { isMockData } from '@/lib/supabase';

/** DEV_NOW / DEV_MOCK_DATA が効いているときだけ右下に出す目印（本番では何も出ない） */
export default function DevBadge() {
  const fakeNow = process.env.NODE_ENV !== 'production' && !!process.env.DEV_NOW;
  const mock = isMockData();
  if (!fakeNow && !mock) return null;

  const label = currentTime().toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="dev-badge" role="status">
      {mock && <b>MOCK DATA</b>}
      {fakeNow && <span>今 = {label} JST</span>}
    </div>
  );
}
