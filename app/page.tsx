import CalendarGrid from '@/components/CalendarGrid';
import { MainHeader, SiteFooter } from '@/components/SiteHeader';
import { eventYear } from '@/lib/publish';
import { getCalendar } from '@/lib/queries';

// 6:00 を過ぎてから最大1分で切り替わる
export const revalidate = 60;

const STEPS = [
  ['01', '空いている箱を予約', '「募集中」の日を選んで、名前と編集用パスワードを入れるだけ。先着順で、1人で何日でも担当できます。'],
  ['02', '記事を書いてURLを登録', 'ブログ・note・Qiita・Zenn など好きな場所で書いて、自分の箱の「編集」からタイトルとURLを登録します。'],
  ['03', '当日6時に箱が開く', '担当日のJST 6:00になるとリンクが公開され、コメントやリアクションが届くようになります。'],
] as const;

export default async function HomePage() {
  const cells = await getCalendar();
  const reservedCount = cells.filter((c) => c.state !== 'open').length;
  const publishedCount = cells.filter((c) => c.state === 'published').length;

  return (
    <>
      <MainHeader />

      <section className="hero wrap">
        <div className="hero-text">
          <h1 className="hero-title">
            Advent
            <br />
            Calendar {eventYear()}
          </h1>
          <p className="hero-lead">
            <span className="pc-only">
              好きなことを、1日1本。メンバーが12月1日から25日まで、趣味の記事を毎日ひとつずつ公開します。箱は担当日の朝6時に開きます。
            </span>
            <span className="sp-only">好きなことを、1日1本。担当日の朝6時に箱が開きます。</span>
          </p>
        </div>
        <dl className="stats">
          <div className="stat">
            <dt>予約済み</dt>
            <dd>
              {reservedCount}
              <small> / 25</small>
            </dd>
          </div>
          <div className="stat">
            <dt>公開済み</dt>
            <dd className="stat-red">
              {publishedCount}
              <small> 本</small>
            </dd>
          </div>
        </dl>
      </section>

      <section id="calendar" className="calendar wrap" aria-label="12月のカレンダー">
        <CalendarGrid cells={cells} />

        <ul className="legend" aria-label="凡例">
          <li>
            <i className="lg-open" />
            募集中 — 誰でも予約できる
          </li>
          <li>
            <i className="lg-res" />
            予約済み — 当日6時まで中身は秘密
          </li>
          <li>
            <i className="lg-pub" />
            公開済み — 開けて読める
          </li>
          <li>
            <i className="lg-today" />
            今日の箱
          </li>
        </ul>
      </section>

      <section id="howto" className="howto wrap">
        <h2 className="h2">参加のしかた</h2>
        <ol className="steps">
          {STEPS.map(([n, h, p]) => (
            <li className="card" key={n}>
              <p className="step-num">{n}</p>
              <h3>{h}</h3>
              <p>{p}</p>
            </li>
          ))}
        </ol>
      </section>

      <SiteFooter />
    </>
  );
}
