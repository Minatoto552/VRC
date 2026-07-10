import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { illustrations } from '../assets/illustrations';
import { PageIntro } from '../components/PageIntro';

const faqItems = [
  {
    question: 'イベント部はどのような活動をしていますか？',
    answer:
      'VRChat上でカフェBarイベントを企画・運営し、説明会やリハーサル、接客導線の調整も行っています。詳細は運営へ確認してください。',
  },
  {
    question: 'イベントへの参加に料金はかかりますか？',
    answer: '現在の案内では料金に関する確定情報はありません。詳細は運営へ確認してください。',
  },
  {
    question: '入部には面接がありますか？',
    answer:
      '説明会後に軽い面接を予定しています。威圧的な選考ではなく、活動方針の確認を目的としたものです。',
  },
  {
    question: 'VRChat初心者でも入部できますか？',
    answer: '初心者でも参加できます。説明会で活動内容を案内するので、まずは運営へ確認してください。',
  },
  {
    question: '抽選には何度でも登録できますか？',
    answer: '現在は抽選機能を使用していません。将来の運用方針は運営へ確認してください。',
  },
  {
    question: '抽選にはどの名前を書けばよいですか？',
    answer: '参加導線が再開する場合は、VRChatで使用しているVRC名を記入してください。詳細は運営へ確認してください。',
  },
  {
    question: 'フレンド申請後はどうすればよいですか？',
    answer: '説明会の案内をお待ちください。返信や日程の詳細は運営へ確認してください。',
  },
];

export const FaqPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="FAQ"
        title="よくある質問"
        description="入部前やイベント参加前に気になりやすい内容を、読みやすい形でまとめています。"
        imageSrc={illustrations.faqGuide}
        imageAlt="FAQを案内するキャラクターイラスト"
        caption="FAQ Lounge"
        chips={['断定できない情報は運営へ確認', 'スマートフォンでも読みやすいアコーディオン表示']}
      >
        <strong>迷ったらまずここから</strong>
        <p>気になる項目を開くと回答が読めます。必要に応じて活動予定ページも合わせて確認してください。</p>
      </PageIntro>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Question Board</span>
            <h2>質問一覧</h2>
          </div>
        </div>

        <div className="accordion-list">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <article key={item.question} className="accordion-item">
                <button
                  type="button"
                  className="accordion-trigger"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span>{item.question}</span>
                  <ChevronDown size={18} className={isOpen ? 'is-open' : ''} />
                </button>
                {isOpen ? <p className="accordion-panel">{item.answer}</p> : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
