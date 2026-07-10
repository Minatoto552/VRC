import { ArrowRight, Clock3, Info, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { PublicContent } from '../../shared/models';

interface ConceptPageProps {
  content: PublicContent;
}

interface EventPanel {
  category: string;
  title: string;
  icon: typeof Info;
  paragraphs?: string[];
  bullets?: string[];
  note?: string;
}

const eventPanels: EventPanel[] = [
  {
    category: 'Overview',
    title: 'イベントの概要',
    icon: Info,
    paragraphs: [
      '四季月家は、2026年3月同期会キャスト部がVRChat上で企画・運営する、親しみやすい夜のカフェBarイベントです。',
      '公開サイトでは、一般のお客様や入部希望者が、次回の活動予定や部員情報、写真アーカイブをひと目で確認できるように整理しています。',
    ],
  },
  {
    category: 'Time Table',
    title: '時間割',
    icon: Clock3,
    bullets: [
      '21:00 開場 / 店内案内スタート',
      '21:15 キャスト紹介と自由歓談',
      '22:00 ミニ企画または説明会導線',
      '22:45 記念フォトタイム',
      '23:00 クローズ',
    ],
    note: '当日の構成に合わせて、管理画面から表示内容を更新できます。',
  },
  {
    category: 'Notes',
    title: '注意事項',
    icon: ShieldCheck,
    bullets: [
      '参加時はVRChatで使用している表示名を確認してください。',
      '撮影やSNS掲載の可否は、当日の案内や運営の指示に従ってください。',
      '詳細なルールが未確定の項目は、運営へ確認してください。',
    ],
    note: '初参加でも緊張しすぎず過ごせるよう、案内はできるだけやさしく整理しています。',
  },
];

export const ConceptPage = ({ content }: ConceptPageProps) => (
  <div className="page-stack">
    <section className="section-card concept-menu-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Event Introduction</span>
          <h1>イベント紹介</h1>
          <p>
            四季月家で伝えたいのは、落ち着いた夜のカフェBarらしさと、はじめて来る人でも入りやすい親しみやすさです。
          </p>
        </div>
      </div>

      <div className="concept-menu-grid">
        {eventPanels.map(({ bullets, category, icon: Icon, note, paragraphs, title }) => (
          <article key={category} className="info-card concept-menu-panel">
            <div className="concept-panel-header">
              <span className="chip subtle-chip">{category}</span>
              <span className="concept-panel-icon">
                <Icon size={18} />
              </span>
            </div>
            <h2>{title}</h2>
            {paragraphs ? (
              <div className="concept-copy-stack">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}
            {bullets ? (
              <ul className="concept-menu-list">
                {bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {note ? <p>{note}</p> : null}
          </article>
        ))}
      </div>
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
          <p>次回の開催日や説明会の日程、対象者、集合場所をカレンダーから確認できます。</p>
          <Link to="/schedule" className="inline-link">
            活動予定を見る <ArrowRight size={16} />
          </Link>
        </article>
        <article className="metric-card">
          <span>Members</span>
          <strong>部員紹介</strong>
          <p>役職や担当、好きな飲み物まで、公開中のメンバー情報をカード形式で見られます。</p>
          <Link to="/members" className="inline-link">
            部員紹介を見る <ArrowRight size={16} />
          </Link>
        </article>
        <article className="metric-card">
          <span>Photos</span>
          <strong>写真アーカイブ</strong>
          <p>イベント写真、日常スライド、ポスター作品をカテゴリごとに一覧できます。</p>
          <Link to="/photos" className="inline-link">
            写真を見る <ArrowRight size={16} />
          </Link>
        </article>
      </div>
    </section>
  </div>
);
