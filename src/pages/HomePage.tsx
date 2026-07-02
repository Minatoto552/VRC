import { ArrowRight, Coffee, LampDesk, MoonStar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { Activity, PublicContent } from '../../shared/models';
import { illustrations } from '../assets/illustrations';
import { PhotoMarquee } from '../components/PhotoMarquee';
import {
  activityKindIcons,
  activityKindLabels,
  findNextActivity,
  formatDate,
  formatTimeRange,
} from '../lib/format';
import { fallbackPhotoStripItems } from '../lib/photo-strip';

interface HomePageProps {
  content: PublicContent;
}

const manifestoCards = [
  {
    title: '入りやすさ',
    description:
      '高級すぎる演出ではなく、初参加でも雰囲気をつかみやすい距離感と案内を優先しています。',
    icon: Coffee,
  },
  {
    title: '夜の没入感',
    description:
      'やわらかな照明、木目、窓際の夜景、ゆっくりしたアニメーションで、静かな高揚感をつくります。',
    icon: MoonStar,
  },
  {
    title: 'わかりやすさ',
    description:
      '活動予定、部員紹介、入部案内の導線を整理し、スマートフォンでも迷わず読み進められるよう整えています。',
    icon: Users,
  },
] as const;

const joinFlow = [
  '部長のVRChatプロフィールを開く',
  'フレンド申請を送り、説明会の案内を待つ',
  '説明会と軽い面接を経て、活動方針を確認する',
] as const;

const faqPreview = [
  'イベント部はどのような活動をしていますか？',
  'VRChat初心者でも入部できますか？',
  '参加前に確認しておくことはありますか？',
] as const;

const featureMoments = [
  {
    title: 'Next Gathering',
    value: '次回予定',
    description: '活動名、開催日、集合場所をひと目で追えるように整理しています。',
  },
  {
    title: 'Night Counter',
    value: '空間演出',
    description: '3D背景とカードUIを重ね、ページをまたいでも世界観が切れない構成です。',
  },
  {
    title: 'Open Guide',
    value: '入部導線',
    description: '説明会までの流れを短いステップで示し、はじめてでも迷いにくくしています。',
  },
] as const;

const sectionArt = {
  faq: illustrations.faqGuide,
  hero: illustrations.welcomeGuide,
  join: illustrations.joinGuide,
  members: illustrations.membersGuide,
  schedule: illustrations.scheduleGuide,
} as const;

const NextActivityCard = ({ activity }: { activity?: Activity }) => {
  if (!activity) {
    return (
      <article className="detail-card next-activity-card">
        <span className="eyebrow">Next Gathering</span>
        <h2>次回の活動予定</h2>
        <p>次回の活動は現在調整中です。</p>
      </article>
    );
  }

  return (
    <article className="detail-card next-activity-card">
      <span className="eyebrow">
        {activityKindIcons[activity.kind]} {activityKindLabels[activity.kind]}
      </span>
      <h2>次回の活動予定</h2>
      <h3>{activity.title}</h3>
      <p>{activity.description}</p>
      <dl className="stacked-details compact-details">
        <div>
          <dt>開催日</dt>
          <dd>{formatDate(activity.date)}</dd>
        </div>
        <div>
          <dt>開催時刻</dt>
          <dd>{formatTimeRange(activity.startTime, activity.endTime)}</dd>
        </div>
        <div>
          <dt>対象者</dt>
          <dd>{activity.targetAudience}</dd>
        </div>
        <div>
          <dt>集合場所</dt>
          <dd>{activity.meetingPoint}</dd>
        </div>
      </dl>
    </article>
  );
};

export const HomePage = ({ content }: HomePageProps) => {
  const nextActivity = findNextActivity(content.activities);
  const previewActivities = content.activities.slice(0, 3);
  const previewMembers = content.members.slice(0, 3);
  const publicMemberCount = content.members.length;
  const publicActivityCount = content.activities.length;
  const nextActivityDate = nextActivity ? formatDate(nextActivity.date) : '現在調整中';
  const nextActivityLabel = nextActivity ? nextActivity.title : '次回予定は準備中です';

  return (
    <div className="page-stack home-story-stack">
      <PhotoMarquee items={fallbackPhotoStripItems} />

      <section className="hero-card hero-card-enhanced hero-cinematic" data-scene-step="entrance">
        <div className="hero-copy">
          <span className="chip">Night Cafe for VRChat</span>
          <h1>
            <span className="hero-title-line">同期のみんなでつくる、</span>
            <span className="hero-title-line">少し特別なカフェ時間。</span>
          </h1>
          <p>
            2026年3月同期会イベント部では、VRChat上でカフェ風のBarイベントを企画・運営しています。
            静かな夜の店内を歩くように、活動予定、部員紹介、入部案内までひと続きで確認できます。
          </p>
          <div className="hero-actions">
            <Link to="/concept" className="primary-button">
              会場の雰囲気を見る
            </Link>
            <Link to="/schedule" className="secondary-button">
              次回の活動を見る
            </Link>
            <Link to="/join" className="secondary-button">
              入部方法を見る
            </Link>
          </div>
          <div className="hero-tags" aria-label="サイトの特徴">
            <span>
              <Coffee size={16} />
              木目とアイボリーの温度感
            </span>
            <span>
              <LampDesk size={16} />
              夜カフェらしい柔らかな灯り
            </span>
            <span>
              <Users size={16} />
              はじめてでも迷いにくい導線
            </span>
          </div>
          <div className="hero-glance-grid" aria-label="イベント概要">
            <article className="hero-glance-card">
              <span className="hero-glance-label">Next Event</span>
              <strong>{nextActivityDate}</strong>
              <small>{nextActivityLabel}</small>
            </article>
            <article className="hero-glance-card">
              <span className="hero-glance-label">Open Schedule</span>
              <strong>{publicActivityCount}件</strong>
              <small>公開中の活動予定を、月表示カレンダーとカードで確認できます。</small>
            </article>
            <article className="hero-glance-card">
              <span className="hero-glance-label">Open Members</span>
              <strong>{publicMemberCount}名</strong>
              <small>役職や担当、好きな飲み物まで含めて紹介しています。</small>
            </article>
          </div>
        </div>

        <div className="hero-scene-summary hero-illustration-stack" aria-label="カフェ空間の演出紹介">
          <div className="hero-floating-chip hero-floating-chip-left">
            <MoonStar size={14} />
            Entrance Scene
          </div>
          <div className="hero-floating-chip hero-floating-chip-right">
            <Coffee size={14} />
            Counter Scene
          </div>
          <div className="hero-illustration-card">
            <img
              src={sectionArt.hero}
              alt="カフェに案内するイラスト"
              className="showcase-illustration hero-illustration"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </div>
          <div className="hero-scene-callout">
            <span className="eyebrow">Night Cafe Direction</span>
            <strong>入口からラウンジまで、静かに奥へ進むようなスクロール体験</strong>
            <p>
              看板の灯り、湯気、窓際の夜景、カウンターまわりの小物を背景の3D空間で描き、
              情報と雰囲気が自然につながる見せ方に整えています。
            </p>
          </div>
        </div>
      </section>

      <section className="section-card manifesto-panel" data-scene-step="counter">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Design Direction</span>
            <h2>Event Cafe をつくる3つの軸</h2>
          </div>
        </div>
        <div className="manifesto-grid">
          {manifestoCards.map(({ description, icon: Icon, title }) => (
            <article key={title} className="info-card manifesto-card">
              <div className="manifesto-icon">
                <Icon size={18} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="two-column-grid story-section-grid">
        <NextActivityCard activity={nextActivity} />
        <article className="detail-card detail-card-spotlight">
          <span className="eyebrow">Tonight&apos;s Overview</span>
          <h2>今夜の Event Cafe</h2>
          <p>{content.settings.siteDescription}</p>
          <div className="feature-moment-list">
            {featureMoments.map((moment) => (
              <article key={moment.title} className="feature-moment-card">
                <span>{moment.title}</span>
                <strong>{moment.value}</strong>
                <p>{moment.description}</p>
              </article>
            ))}
          </div>
          <Link to="/concept" className="inline-link">
            会場案内を見る <ArrowRight size={16} />
          </Link>
        </article>
      </section>

      <section className="section-card story-section showcase-section" data-scene-step="chalkboard">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Scene 3</span>
            <h2>活動予定プレビュー</h2>
          </div>
          <Link to="/schedule" className="secondary-button">
            カレンダーを見る
          </Link>
        </div>
        <div className="showcase-layout showcase-layout-reverse">
          <figure className="showcase-figure">
            <img
              src={sectionArt.schedule}
              alt="活動予定を案内するイラスト"
              className="showcase-illustration"
              loading="lazy"
              decoding="async"
            />
            <figcaption className="showcase-caption">Schedule Scene</figcaption>
          </figure>
          <div className="card-grid showcase-content">
            {previewActivities.length === 0 ? (
              <p className="empty-message">次回の活動は現在調整中です。</p>
            ) : (
              previewActivities.map((activity) => (
                <article key={activity.id} className="info-card">
                  <span className="chip subtle-chip">
                    {activityKindIcons[activity.kind]} {activityKindLabels[activity.kind]}
                  </span>
                  <h3>{activity.title}</h3>
                  <p>{activity.description}</p>
                  <dl className="stacked-details">
                    <div>
                      <dt>日時</dt>
                      <dd>
                        {formatDate(activity.date)} /{' '}
                        {formatTimeRange(activity.startTime, activity.endTime)}
                      </dd>
                    </div>
                    <div>
                      <dt>集合場所</dt>
                      <dd>{activity.meetingPoint}</dd>
                    </div>
                  </dl>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="section-card story-section showcase-section" data-scene-step="members">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Scene 4</span>
            <h2>部員紹介プレビュー</h2>
          </div>
          <Link to="/members" className="secondary-button">
            部員一覧へ
          </Link>
        </div>
        <div className="showcase-layout">
          <figure className="showcase-figure">
            <img
              src={sectionArt.members}
              alt="部員紹介を案内するイラスト"
              className="showcase-illustration"
              loading="lazy"
              decoding="async"
            />
            <figcaption className="showcase-caption">Members Wall</figcaption>
          </figure>
          <div className="member-grid showcase-content">
            {previewMembers.length === 0 ? (
              <p className="empty-message">部員情報は現在準備中です。</p>
            ) : (
              previewMembers.map((member) => (
                <article
                  key={member.id}
                  className={`member-card ${member.isLeadership ? 'is-leadership' : ''}`}
                >
                  <span className="chip subtle-chip">{member.role}</span>
                  <h2>{member.vrcName}</h2>
                  <p>{member.bio}</p>
                  <dl className="stacked-details compact-details">
                    <div>
                      <dt>担当</dt>
                      <dd>{member.duties}</dd>
                    </div>
                    <div>
                      <dt>好きな飲み物</dt>
                      <dd>{member.favoriteDrink}</dd>
                    </div>
                  </dl>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="section-card story-section showcase-section" data-scene-step="guide">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Scene 5</span>
            <h2>入部までの流れ</h2>
          </div>
          <Link to="/join" className="secondary-button">
            入部案内へ
          </Link>
        </div>
        <div className="showcase-layout showcase-layout-reverse">
          <figure className="showcase-figure">
            <img
              src={sectionArt.join}
              alt="入部方法を案内するイラスト"
              className="showcase-illustration"
              loading="lazy"
              decoding="async"
            />
            <figcaption className="showcase-caption">Join Flow</figcaption>
          </figure>
          <ol className="story-step-list showcase-content">
            {joinFlow.map((step, index) => (
              <li key={step}>
                <span className="step-index" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <strong>{step}</strong>
                  <p>詳細は運営へ確認してください。</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-card story-section showcase-section" data-scene-step="concept">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Scene 6</span>
            <h2>会場の雰囲気を知る</h2>
          </div>
          <Link to="/concept" className="primary-button">
            会場案内へ
          </Link>
        </div>
        <div className="concept-preview-grid">
          <article className="detail-card concept-preview-card">
            <span className="eyebrow">Counter Mood</span>
            <h3>木製カウンターを中心にした、会話のための空間</h3>
            <p>
              ペンダントライト、カップ、棚のボトル、窓際の夜景をまとめて見せ、
              高級すぎず、それでいて少し特別に感じる距離感を意識しています。
            </p>
          </article>
          <article className="detail-card concept-preview-card">
            <span className="eyebrow">Site Flow</span>
            <h3>ページ自体が、店内を歩く順路になる構成</h3>
            <p>
              入口のヒーローから活動予定、部員紹介、入部案内へ進み、
              最後にFAQで安心して締められるよう体験の順番を整えています。
            </p>
          </article>
        </div>
      </section>

      <section
        className="section-card story-section story-section-closing showcase-section"
        data-scene-step="closing"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">Scene 7</span>
            <h2>よくある質問</h2>
          </div>
          <Link to="/faq" className="secondary-button">
            FAQを見る
          </Link>
        </div>
        <div className="showcase-layout showcase-layout-reverse">
          <figure className="showcase-figure">
            <img
              src={sectionArt.faq}
              alt="よくある質問を案内するイラスト"
              className="showcase-illustration"
              loading="lazy"
              decoding="async"
            />
            <figcaption className="showcase-caption">FAQ Lounge</figcaption>
          </figure>
          <div className="mini-faq-list showcase-content">
            {faqPreview.map((question) => (
              <article key={question} className="info-card">
                <strong>{question}</strong>
                <p>詳細は運営へ確認してください。</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
