import CalendarGrid from '@/components/CalendarGrid';
import CalendarTabs from '@/components/CalendarTabs';
import { MainHeader, SiteFooter } from '@/components/SiteHeader';
import { CALENDARS } from '@/lib/calendars';
import { eventYear } from '@/lib/publish';
import { getCalendar } from '@/lib/queries';

// 6:00 を過ぎてから最大1分で切り替わる
export const revalidate = 60;

const STEPS = [
  ['01', '空いている箱を予約', '「募集中」の日を選んで、名前と編集用パスワードを入れよう！先着順で、1人で何日でも担当できるよ！'],
  ['02', '記事を書いてURLを登録', 'ブログ・note・Qiita・Zenn など好きなプラットフォームで書いて、当日までに自分の箱の「編集」からタイトルとURLを登録してね。'],
  ['03', '当日6時に箱が開くよ！', '担当日の朝6時になるとリンクが公開されて、コメントやリアクションが届くようになるよ！'],
] as const;

export default async function HomePage() {
  const calendars = await Promise.all(CALENDARS.map(async (cal) => ({ cal, cells: await getCalendar(cal) })));

  return (
    <>
      <MainHeader />

      <section className="hero wrap">
        <div className="hero-text">
          <h1 className="hero-title">
            FriOn Advent
            <br />
            Calendar <span className="hero-year">{eventYear()}</span>
          </h1>
          <p className="hero-lead">
            金オンのみんなで、クリスマスをお祝いしよう！12月1日から25日まで、趣味の記事が毎日公開されます。毎朝6時、小箱の中から誰かの「好き」が届きます。
          </p>
        </div>
      </section>

      <section id="calendar" className="calendar wrap" aria-label="12月のカレンダー">
        <CalendarTabs
          panels={calendars.map(({ cal, cells }) => ({
            cal,
            openCount: cells.filter((c) => c.state === 'open').length,
            content: <CalendarGrid cells={cells} />,
          }))}
        />

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
