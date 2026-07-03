import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Coffee,
  DoorOpen,
  LampDesk,
  MoonStar,
  Users,
} from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import type { PublicContent } from '../../shared/models';
import { illustrations } from '../assets/illustrations';
import { PhotoMarquee } from '../components/PhotoMarquee';
import { formatDate, formatTimeRange, findNextActivity } from '../lib/format';
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
    title: 'イベント紹介',
    description:
      '夜のカフェBarをテーマにした、初めての人でも入りやすいVRChatイベントです。',
    icon: Coffee,
    to: '/concept',
    tone: 'amber',
  },
  {
    title: '活動予定',
    description: '次回の開催日、時間、集合場所をスマホでも読みやすい形で確認できます。',
    icon: CalendarDays,
    to: '/schedule',
    tone: 'green',
  },
  {
    title: '部員紹介',
    description: '役職や担当、好きな飲み物など、イベント部の雰囲気が分かる紹介ページです。',
    icon: Users,
    to: '/members',
    tone: 'navy',
  },
  {
    title: '入部案内',
    description: 'プロフィール確認から説明会、軽い面接までの流れを順番に案内します。',
    icon: DoorOpen,
    to: '/join',
    tone: 'rose',
  },
] as const;

const faqItems = [
  {
    question: 'イベント部はどのような活動をしていますか？',
    answer:
      'VRChat上でカフェ風のBarイベントを企画し、会場案内、接客、進行、広報、演出などを分担して運営します。',
  },
  {
    question: 'VRChat初心者でも入部できますか？',
    answer:
      '初心者でも参加できます。必要な準備や活動方針は説明会で確認できます。詳細は運営へ確認してください。',
  },
  {
    question: '参加前に確認しておくことはありますか？',
    answer:
      '活動予定、集合場所、対象者を確認してください。入部希望の場合は部長のVRChatプロフィールから案内を受け取る流れです。',
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

  const heroImageY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 48]);
  const heroTextY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -24]);
  const nextActivity = findNextActivity(content.activities);

  return (
    <div className="home-redesign-stack">
      <PhotoMarquee items={fallbackPhotoStripItems} />

      <motion.section
        ref={heroRef}
        className="home-hero-bento"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.62, ease: [0.2, 0.72, 0.2, 1] }}
      >
        <motion.div className="home-hero-copy" style={{ y: heroTextY }}>
          <span className="home-hero-chip">
            <LampDesk size={16} />
            VRChat Cafe Bar 2026年3月同期会
          </span>
          <h1>Event Café</h1>
          <p>
            同期のみんなでつくる、少し特別なカフェ時間。VRChat上で開くカフェ風Barイベントの活動予定、部員紹介、入部案内をひとつの流れで確認できます。
          </p>
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
        </motion.div>

        <motion.div className="home-hero-visual" style={{ y: heroImageY }}>
          <img
            src={illustrations.welcomeGuide}
            alt="Event Cafeへ案内するキャラクター"
            className="home-hero-character"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </motion.div>
      </motion.section>

      <motion.section
        className="home-bento-grid home-bento-grid-simple"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
        transition={{ staggerChildren: 0.07 }}
      >
        <motion.article variants={fadeUp} className="bento-panel bento-summary-panel">
          <div className="bento-panel-kicker">
            <MoonStar size={18} />
            Tonight
          </div>
          <h2>見たい情報へ、少ないステップで。</h2>
          <p>
            カードの数を絞り、主要な導線だけを大きく配置しました。予定、部員、入部案内へすぐ移動できます。
          </p>
        </motion.article>

        <motion.article variants={fadeUp} className="bento-panel bento-next-compact">
          <div className="bento-panel-kicker">
            <CalendarDays size={18} />
            Next
          </div>
          {nextActivity ? (
            <>
              <h2>{nextActivity.title}</h2>
              <p>
                {formatDate(nextActivity.date)} /{' '}
                {formatTimeRange(nextActivity.startTime, nextActivity.endTime)}
              </p>
            </>
          ) : (
            <>
              <h2>次回の活動は調整中です。</h2>
              <p>公開できる予定が決まり次第、活動予定ページへ反映します。</p>
            </>
          )}
          <Link to="/schedule" className="inline-link">
            活動予定を見る <ArrowRight size={16} />
          </Link>
        </motion.article>

        {bentoItems.map(({ description, icon: Icon, title, to, tone }) => (
          <motion.article
            key={title}
            variants={fadeUp}
            className={`bento-panel bento-mini-panel tone-${tone}`}
            whileHover={reduceMotion ? undefined : { y: -4 }}
          >
            <Icon size={22} />
            <h3>{title}</h3>
            <p>{description}</p>
            <Link to={to} className="inline-link">
              開く <ArrowRight size={16} />
            </Link>
          </motion.article>
        ))}
      </motion.section>

      <motion.section
        className="home-faq-accordion"
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
