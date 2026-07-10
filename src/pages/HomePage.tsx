import {
  ArrowRight,
  CalendarDays,
  Camera,
  ChevronDown,
  Coffee,
  DoorOpen,
  Users,
} from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import type { PublicContent } from '../../shared/models';
import { illustrations } from '../assets/illustrations';
import { PhotoMarquee } from '../components/PhotoMarquee';
import { findNextActivity, formatDate, formatTimeRange } from '../lib/format';
import { fallbackPhotoStripItems } from '../lib/photo-strip';

interface HomePageProps {
  content: PublicContent;
}

const fadeUp = {
  hidden: { opacity: 0.76, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const bentoItems = [
  {
    title: 'イベントの概要',
    description: '四季月家の世界観や、VRChat上で開くカフェBarイベントの雰囲気を紹介します。',
    icon: Coffee,
    label: 'Concept',
    meta: '店内と企画の案内',
    to: '/concept',
    tone: 'amber',
  },
  {
    title: '活動予定',
    description: '次回の開催日や内容、対象者、集合場所を月カレンダーで確認できます。',
    icon: CalendarDays,
    label: 'Schedule',
    meta: '日付から確認',
    to: '/schedule',
    tone: 'green',
  },
  {
    title: '部員紹介',
    description: '役職、担当、好きな飲み物まで、公開中のメンバー情報を一覧で見られます。',
    icon: Users,
    label: 'Members',
    meta: 'キャストの顔ぶれ',
    to: '/members',
    tone: 'navy',
  },
  {
    title: '入部案内',
    description: '説明会から面接までの流れを、初めての人でも迷わない順序でまとめています。',
    icon: DoorOpen,
    label: 'Join',
    meta: '6ステップ',
    to: '/join',
    tone: 'rose',
  },
  {
    title: '写真アーカイブ',
    description: 'イベント写真、日常スライド、ポスター作品をカテゴリ別に見られる写真ページです。',
    icon: Camera,
    label: 'Photos',
    meta: '横スライド / 縦ポスター',
    to: '/photos',
    tone: 'amber',
  },
] as const;

const faqItems = [
  {
    question: '四季月家ではどのような活動をしていますか？',
    answer:
      'VRChat上でカフェBarイベントを企画・運営し、説明会やリハーサル、接客導線の調整も行っています。詳細は運営へ確認してください。',
  },
  {
    question: 'VRChat初心者でも入部できますか？',
    answer:
      '初心者でも参加できます。説明会で活動内容を案内したうえで進めるので、まずは入部案内ページから流れを確認してください。',
  },
  {
    question: '写真やポスターはどこで見られますか？',
    answer:
      '写真ページに、イベント写真、キャストの日常、ポスター作品をカテゴリごとにまとめています。',
  },
] as const;

const MotionLink = motion.create(Link);

export const HomePage = ({ content }: HomePageProps) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState(0);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroImageY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 42]);
  const heroTextY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -18]);
  const nextActivity = findNextActivity(content.activities);
  const nextActivityDate = nextActivity
    ? `${formatDate(nextActivity.date)} / ${formatTimeRange(nextActivity.startTime, nextActivity.endTime)}`
    : '現在調整中';

  return (
    <div className="home-redesign-stack">
      <PhotoMarquee items={fallbackPhotoStripItems} />

      <motion.section
        ref={heroRef}
        className="home-hero-bento home-hero-editorial gsap-reveal"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.62, ease: [0.2, 0.72, 0.2, 1] }}
      >
        <motion.div className="home-hero-copy" style={{ y: heroTextY }}>
          <h1>
            <span>夜のカフェBarへ、ようこそ。</span>
          </h1>
          <p>{content.settings.siteDescription}</p>
          <div className="home-hero-actions">
            <MotionLink
              to="/schedule"
              className="primary-button"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              次回の活動を見る
            </MotionLink>
            <MotionLink
              to="/join"
              className="secondary-button"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              入部方法を見る
            </MotionLink>
          </div>
          <dl className="home-hero-proof" aria-label="サイトの主な情報">
            <div>
              <dt>Next</dt>
              <dd>{nextActivityDate}</dd>
            </div>
            <div>
              <dt>Cast</dt>
              <dd>{content.members.length}名を公開中</dd>
            </div>
          </dl>
        </motion.div>

        <motion.div className="home-hero-visual" style={{ y: heroImageY }}>
          <div className="home-hero-art-panel">
            <span className="home-art-orbit home-art-orbit-one" aria-hidden="true" />
            <span className="home-art-orbit home-art-orbit-two" aria-hidden="true" />
            <img
              src={illustrations.welcomeGuide}
              alt="四季月家へ案内するキャラクターイラスト"
              className="home-hero-character"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </div>
          <div className="home-floating-card home-floating-card-next" aria-hidden="true">
            <span>Next Event</span>
            <strong>{nextActivity?.title ?? '活動予定を調整中'}</strong>
          </div>
          <div className="home-floating-card home-floating-card-menu" aria-hidden="true">
            <span>Photo Menu</span>
            <strong>Event / Daily / Poster</strong>
          </div>
        </motion.div>
      </motion.section>

      <motion.section
        className="home-bento-grid home-bento-grid-simple home-bento-editorial gsap-stagger"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
        transition={{ staggerChildren: 0.07 }}
      >
        <motion.article variants={fadeUp} className="bento-panel bento-summary-panel gsap-card">
          <div className="bento-panel-kicker">
            <Coffee size={18} />
            Event Overview
          </div>
          <h2>同期のみんなでつくる、少し特別なカフェ時間。</h2>
          <p>
            2026年3月同期会キャスト部が、夜の店内演出とやわらかな接客導線を両立させたVRChatイベントを案内します。
            活動予定、部員紹介、入部案内、写真アーカイブをひとつの流れで確認できます。
          </p>
          <div className="bento-mini-metrics" aria-label="サイトの特徴">
            <span>Mobile first</span>
            <span>Warm cafe tone</span>
            <span>Photo managed in admin</span>
          </div>
        </motion.article>

        <motion.article variants={fadeUp} className="bento-panel bento-next-compact gsap-card">
          <div className="bento-panel-kicker">
            <CalendarDays size={18} />
            Next Schedule
          </div>
          {nextActivity ? (
            <>
              <h2>{nextActivity.title}</h2>
              <p>
                {formatDate(nextActivity.date)} / {formatTimeRange(nextActivity.startTime, nextActivity.endTime)}
              </p>
            </>
          ) : (
            <>
              <h2>次回の活動は現在調整中です。</h2>
              <p>公開用の予定が登録されると、ここに最新情報が反映されます。</p>
            </>
          )}
          <Link to="/schedule" className="inline-link">
            活動予定を見る <ArrowRight size={16} />
          </Link>
        </motion.article>

        {bentoItems.map(({ description, icon: Icon, label, meta, title, to, tone }) => (
          <motion.article
            key={title}
            variants={fadeUp}
            className={`bento-panel bento-mini-panel tone-${tone} gsap-card`}
            whileHover={reduceMotion ? undefined : { y: -4 }}
          >
            <div className="bento-mini-topline">
              <span>{label}</span>
              <span>{meta}</span>
            </div>
            <div className="bento-icon-shell">
              <Icon size={22} />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
            <Link to={to} className="inline-link">
              開く <ArrowRight size={16} />
            </Link>
          </motion.article>
        ))}
      </motion.section>

      <section className="home-story-split gsap-reveal">
        <div className="home-story-copy">
          <span className="bento-panel-kicker">Flow</span>
          <h2>入口から写真アーカイブまで、見たい情報にすぐ届く構成です。</h2>
          <p>
            上部の写真スライドで空気感をつかみ、トップで全体像を確認し、そのまま活動予定、部員紹介、入部案内、
            写真ページへ自然につながるように並べています。
          </p>
        </div>
        <div className="home-story-board" aria-hidden="true">
          <span>01 Event Intro</span>
          <span>02 Schedule</span>
          <span>03 Members</span>
          <span>04 Photos</span>
        </div>
      </section>

      <motion.section
        className="home-faq-accordion gsap-reveal"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.22 }}
        variants={fadeUp}
        transition={{ duration: 0.5 }}
      >
        <div className="home-faq-heading">
          <span className="bento-panel-kicker">FAQ</span>
          <h2>よくある質問</h2>
        </div>
        <div className="home-faq-list">
          {faqItems.map((item, index) => {
            const isOpen = openFaq === index;

            return (
              <article key={item.question} className={`home-faq-item ${isOpen ? 'is-open' : ''}`}>
                <button type="button" onClick={() => setOpenFaq(isOpen ? -1 : index)}>
                  <span>{item.question}</span>
                  <ChevronDown size={18} aria-hidden="true" />
                </button>
                {isOpen ? <p>{item.answer}</p> : null}
              </article>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
};
