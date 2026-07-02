import { ArrowRight, Coffee, LampDesk, Sparkles, Users } from 'lucide-react';
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
  lotteryStatusLabels,
} from '../lib/format';
import { fallbackPhotoStripItems } from '../lib/photo-strip';

interface HomePageProps {
  content: PublicContent;
}

const joinFlow = [
  '部長のVRChatプロフィールを開く',
  '部長へフレンド申請を送る',
  '説明会へ参加し、軽い面接を受ける',
];

const faqPreview = [
  'イベント部はどのような活動をしていますか？',
  'VRChat初心者でも入部できますか？',
  '抽選にはどの名前を書けばよいですか？',
];

const sectionArt = {
  faq: illustrations.faqGuide,
  hero: illustrations.welcomeGuide,
  join: illustrations.joinGuide,
  lottery: illustrations.lotteryGuide,
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
  const nextActivityDate = nextActivity ? formatDate(nextActivity.date) : '現在調整中';
  const nextActivityLabel = nextActivity ? nextActivity.title : '次回予定は準備中です';
  const lotteryStatus = lotteryStatusLabels[content.settings.lotteryStatus];

  return (
    <div className="page-stack home-story-stack">
      <PhotoMarquee items={fallbackPhotoStripItems} />

      <section
        className="hero-card hero-card-enhanced hero-cinematic"
        data-scene-step="entrance"
      >
        <div className="hero-copy">
          <span className="chip">Cafe Bar Event</span>
          <h1>
            <span className="hero-title-line">同期のみんなでつくる、</span>
            <span className="hero-title-line">少し特別なカフェ時間。</span>
          </h1>
          <p>
            2026年3月同期会イベント部では、VRChat上でカフェ風のBarイベントを企画・運営しています。
          </p>
          <div className="hero-actions">
            <Link to="/schedule" className="primary-button">
              次回の活動を見る
            </Link>
            <Link to="/lottery" className="secondary-button">
              抽選に参加する
            </Link>
            <Link to="/join" className="secondary-button">
              入部方法を見る
            </Link>
          </div>
          <div className="hero-tags" aria-label="サイトの特徴">
            <span>
              <Coffee size={16} />
              やわらかな照明
            </span>
            <span>
              <LampDesk size={16} />
              夜カフェ風の演出
            </span>
            <span>
              <Users size={16} />
              初参加でも入りやすい案内
            </span>
          </div>
          <div className="hero-glance-grid" aria-label="イベント概要">
            <article className="hero-glance-card">
              <span className="hero-glance-label">Next Event</span>
              <strong>{nextActivityDate}</strong>
              <small>{nextActivityLabel}</small>
            </article>
            <article className="hero-glance-card">
              <span className="hero-glance-label">Lottery Status</span>
              <strong>{lotteryStatus}</strong>
              <small>VRC名だけで参加できる抽選フォームを公開しています。</small>
            </article>
            <article className="hero-glance-card">
              <span className="hero-glance-label">Open Members</span>
              <strong>{publicMemberCount}名</strong>
              <small>公開プロフィールと活動案内をスマートフォン優先で整えています。</small>
            </article>
          </div>
        </div>

        <div className="hero-scene-summary hero-illustration-stack" aria-label="カフェ空間の演出紹介">
          <div className="hero-floating-chip hero-floating-chip-left">
            <Sparkles size={14} />
            Entrance Scene
          </div>
          <div className="hero-floating-chip hero-floating-chip-right">
            <Sparkles size={14} />
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
            <strong>入口からカウンターへ、スクロールで店内をたどる演出</strong>
            <p>
              看板の灯り、湯気、窓際の夜景、抽選箱の演出を背景の3D空間で体験しながら、各ページの情報へ進めます。
            </p>
          </div>
        </div>
      </section>

      <section className="two-column-grid story-section-grid" data-scene-step="counter">
        <NextActivityCard activity={nextActivity} />
        <article className="detail-card">
          <span className="eyebrow">Cafe Atmosphere</span>
          <h2>今夜のEvent Cafe</h2>
          <p>{content.settings.siteDescription}</p>
          <ul className="feature-list">
            <li>木目とアイボリーを軸にした、親しみやすいカフェBarデザイン</li>
            <li>スマートフォンでも見やすいカードとカレンダー中心の構成</li>
            <li>活動予定、入部案内、抽選受付が迷わず見つかる導線</li>
          </ul>
          <Link to="/faq" className="inline-link">
            よくある質問を見る <ArrowRight size={16} />
          </Link>
        </article>
      </section>

      <section
        className="section-card story-section showcase-section"
        data-scene-step="chalkboard"
      >
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

      <section
        className="section-card story-section showcase-section"
        data-scene-step="members"
      >
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

      <section
        className="section-card story-section showcase-section"
        data-scene-step="lottery"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">Scene 6</span>
            <h2>抽選受付</h2>
          </div>
          <Link to="/lottery" className="primary-button">
            抽選フォームへ
          </Link>
        </div>
        <div className="showcase-layout">
          <figure className="showcase-figure">
            <img
              src={sectionArt.lottery}
              alt="抽選受付を案内するイラスト"
              className="showcase-illustration"
              loading="lazy"
              decoding="async"
            />
            <figcaption className="showcase-caption">Lottery Counter</figcaption>
          </figure>
          <div className="two-column-grid story-section-grid showcase-content">
            <article className="detail-card">
              <p>
                抽選に参加する方は、VRChatで使用している名前を入力してください。登録前に確認画面が表示され、二重送信も防止されます。
              </p>
              <div className="warning-box">
                <Sparkles size={18} />
                <div>
                  <strong>必ずVRC名を入力してください。</strong>
                  <p>Xの名前、Discordの名前、ニックネームなどは使用しないでください。</p>
                </div>
              </div>
            </article>
            <article className="detail-card">
              <span className="eyebrow">Current Status</span>
              <h3>{content.settings.siteName}</h3>
              <p>{content.settings.lotteryNotice}</p>
              <Link to="/lottery" className="inline-link">
                抽選に進む <ArrowRight size={16} />
              </Link>
            </article>
          </div>
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
