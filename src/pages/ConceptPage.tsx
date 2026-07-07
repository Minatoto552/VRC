import { ArrowRight, Coffee, LampDesk, MoonStar } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { PublicContent } from '../../shared/models';

interface ConceptPageProps {
  content: PublicContent;
}

const spaceCards = [
  {
    title: 'Entrance',
    label: 'やわらかな導入',
    description:
      '入口では店名のサインと夜景の灯りで迎え、はじめて訪れる人でも空気感をつかみやすい導線にしています。',
    icon: MoonStar,
  },
  {
    title: 'Counter',
    label: '会話が生まれる中心',
    description:
      '木製のカウンター、カップ、ボトル、ペンダントライトを中心に、落ち着いて話せる距離感を意識しています。',
    icon: Coffee,
  },
  {
    title: 'Lounge',
    label: '静かな余韻',
    description:
      '窓際や奥の席は、説明会や交流後に余韻を残せるよう、少し静かなテンポの見せ方でまとめています。',
    icon: LampDesk,
  },
] as const;

const visitFlow = [
  '店内の雰囲気や次回予定を見ながら、参加イメージをつかむ',
  '活動予定ページで開催日と対象者を確認する',
  '部員紹介やFAQを見て、不安な点を先に解消する',
  '興味があれば入部案内ページから説明会までの流れを確認する',
] as const;

const cafeMenuGroups = [
  {
    category: 'Cafe',
    title: 'カフェメニュー',
    items: ['カフェラテ', 'アイスコーヒー', 'ほうじ茶ラテ'],
    note: '落ち着いて話せる、やさしい雰囲気のメニュー名を想定しています。',
  },
  {
    category: 'Bar',
    title: 'Bar風メニュー',
    items: ['ノンアルモクテル', '琥珀ソーダ', '夜景レモネード'],
    note: '高級すぎず、初参加でも頼みやすい名前に整えます。',
  },
  {
    category: 'Event',
    title: 'イベント演出',
    items: ['本日のおすすめ', '説明会プレート', '記念フォトタイム'],
    note: '実際の提供ではなく、VRChat内の案内・演出として使う想定です。',
  },
] as const;

export const ConceptPage = ({ content }: ConceptPageProps) => (
  <div className="page-stack">
    <section className="section-card concept-menu-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Cafe Menu</span>
          <h1>メニュー補足</h1>
          <p>
            Event Caféの雰囲気を伝えるための仮メニューです。実際の提供内容や演出は、
            当日の運営案内に合わせて調整します。
          </p>
        </div>
      </div>

      <div className="concept-menu-grid">
        {cafeMenuGroups.map((group) => (
          <article key={group.category} className="info-card concept-menu-panel">
            <span className="chip subtle-chip">{group.category}</span>
            <h2>{group.title}</h2>
            <ul className="concept-menu-list">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>{group.note}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="section-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Spatial Rhythm</span>
          <h2>店内の見せ方</h2>
        </div>
      </div>

      <div className="concept-stage-grid">
        {spaceCards.map(({ description, icon: Icon, label, title }) => (
          <article key={title} className="info-card concept-stage-card">
            <div className="concept-stage-icon">
              <Icon size={18} />
            </div>
            <span className="chip subtle-chip">{title}</span>
            <h3>{label}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="section-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Visit Flow</span>
          <h2>おすすめの見かた</h2>
        </div>
      </div>

      <ol className="story-step-list story-step-list-wide">
        {visitFlow.map((step, index) => (
          <li key={step}>
            <span className="step-index" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <strong>{step}</strong>
              <p>
                公開サイトは、いきなり細かな情報を読むのではなく、雰囲気から順に理解できるようページ構成を整えています。
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>

    <section className="section-card concept-closing-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Next Move</span>
          <h2>{content.settings.siteName} をもっと知る</h2>
        </div>
      </div>

      <div className="overview-stat-grid">
        <article className="metric-card">
          <span>Schedule</span>
          <strong>活動予定</strong>
          <p>次回開催日や説明会の日程を、黒板メニューのように一覧できます。</p>
          <Link to="/schedule" className="inline-link">
            活動予定を見る <ArrowRight size={16} />
          </Link>
        </article>
        <article className="metric-card">
          <span>Members</span>
          <strong>部員紹介</strong>
          <p>役職や担当、好きな飲み物まで含めて、空気感の伝わるカードで確認できます。</p>
          <Link to="/members" className="inline-link">
            部員紹介を見る <ArrowRight size={16} />
          </Link>
        </article>
        <article className="metric-card">
          <span>Join Guide</span>
          <strong>入部案内</strong>
          <p>説明会までの流れを順番に追えるので、初見でも迷いにくくなっています。</p>
          <Link to="/join" className="inline-link">
            入部案内を見る <ArrowRight size={16} />
          </Link>
        </article>
      </div>
    </section>
  </div>
);
