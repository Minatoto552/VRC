import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { illustrations } from '../assets/illustrations';
import { PageIntro } from '../components/PageIntro';

const faqItems = [
  {
    question: 'イベント部はどのような活動をしていますか？',
    answer:
      'VRChat上でのカフェ風イベントの企画、運営、案内を行っています。詳細は運営へ確認してください。',
  },
  {
    question: 'イベントへの参加に料金はかかりますか？',
    answer: '現在の案内では無料参加を想定していますが、詳細は運営へ確認してください。',
  },
  {
    question: '入部には面接がありますか？',
    answer: '説明会後に軽い面接を予定しています。詳細は運営へ確認してください。',
  },
  {
    question: 'VRChat初心者でも入部できますか？',
    answer: '初心者の方でも参加しやすい案内を予定しています。詳細は運営へ確認してください。',
  },
  {
    question: '途中からイベントを見に行っても大丈夫ですか？',
    answer: '活動内容によって案内が異なる場合があります。詳細は運営へ確認してください。',
  },
  {
    question: '公開サイトに載っている内容は確定ですか？',
    answer: '公開準備中の内容を含む場合があります。最新情報は活動予定ページや運営案内をご確認ください。',
  },
  {
    question: 'フレンド申請後はどうすればよいですか？',
    answer: '説明会の案内をお待ちください。詳細は運営へ確認してください。',
  },
];

export const FaqPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="FAQ"
        title="よくある質問"
        description="入部、イベント参加、公開サイトの見かたについて、よく確認されるポイントをまとめています。迷ったときに最初に見る案内ボードのような役割です。"
        imageSrc={illustrations.faqGuide}
        imageAlt="よくある質問を案内するカフェ風イラスト"
        caption="FAQ Lounge"
        chips={['詳細未確定の内容は運営へ確認', 'スマートフォンでも読みやすいアコーディオン表示']}
      >
        <strong>確認のしかた</strong>
        <p>気になる質問だけを開いて読めるので、長文を一度に追わなくても必要な情報を探せます。</p>
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
