import { illustrations } from '../assets/illustrations';
import { PageIntro } from '../components/PageIntro';

const joinSteps = [
  '部長のVRChatプロフィールを開く',
  '部長へフレンド申請を送る',
  '部長から説明会の案内を受け取る',
  'イベント部の説明会に参加する',
  '説明会後、軽い面接に参加する',
  '面接後、入部についての案内を受ける',
];

const notes = [
  'フレンド申請を送る際は、ご自身のVRC名を確認してください。',
  '説明会の日程は、活動予定カレンダーから確認できます。',
  '今後は、説明会後に軽い面接を行う予定です。',
  '面接は、入部希望者と活動方針を確認するための簡単なものです。',
  '威圧的な選考ではなく、お互いに安心して活動できるかを確認することが目的です。',
  'フレンド申請を送っただけでは、入部完了にはなりません。',
];

interface JoinPageProps {
  guideNote: string;
}

export const JoinPage = ({ guideNote }: JoinPageProps) => (
  <div className="page-stack">
    <PageIntro
      eyebrow="Join Guide"
      title="入部案内"
      description="説明会までの流れを、店内の案内板を見るような感覚で順番に確認できます。はじめての方でも迷いにくいよう、必要な行動だけを短く整理しています。"
      imageSrc={illustrations.joinGuide}
      imageAlt="入部案内を示すカフェ風イラスト"
      caption="Join Flow"
      chips={['説明会後に軽い面接を予定', 'フレンド申請だけでは入部完了になりません']}
    >
      <strong>参加前のポイント</strong>
      <p>プロフィール確認、フレンド申請、説明会参加の順に進めるとスムーズです。</p>
    </PageIntro>

    <section className="section-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Step Guide</span>
          <h2>入部までの流れ</h2>
        </div>
      </div>

      <ol className="steps-list">
        {joinSteps.map((step, index) => (
          <li key={step}>
            <span className="step-index" aria-hidden="true">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <div className="callout-card">
        <h2>部長のVRChatプロフィール</h2>
        <p>プロフィールを新しいタブで開き、フレンド申請後に説明会案内をお待ちください。</p>
        <a
          href="https://vrchat.com/home/user/usr_fced5ed4-b8e1-47d6-8511-2f92f24bb2e7"
          className="primary-button inline-button"
          target="_blank"
          rel="noopener noreferrer"
        >
          部長のVRChatプロフィールを開く
        </a>
      </div>

      <div className="notice-box" role="note" aria-label="入部時の注意事項">
        <h2>注意事項</h2>
        <div className="notice-box-content">
          <p>{guideNote}</p>
          <ul className="feature-list">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  </div>
);
