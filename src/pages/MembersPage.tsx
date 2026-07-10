import type { MemberProfile } from '../../shared/models';
import { illustrations } from '../assets/illustrations';
import { PageIntro } from '../components/PageIntro';
import { buildAvatarImage } from '../lib/avatar';

interface MembersPageProps {
  members: MemberProfile[];
}

export const MembersPage = ({ members }: MembersPageProps) => {
  const leadershipCount = members.filter((member) => member.isLeadership).length;

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Cast Members"
        title="部員紹介"
        description="役職、担当、好きな飲み物まで、公開中のメンバー情報を一覧で見られるページです。"
        imageSrc={illustrations.membersGuide}
        imageAlt="部員紹介を案内するキャラクターイラスト"
        caption="Members Wall"
        chips={[`公開中の部員: ${members.length}名`, `リーダー表示: ${leadershipCount}名`]}
        reverse
      >
        <strong>プロフィールの見どころ</strong>
        <p>役職や担当だけでなく、短い自己紹介と好きな飲み物もあわせて確認できます。</p>
      </PageIntro>

      <section className="section-card">
        <div className="overview-stat-grid">
          <article className="metric-card">
            <span>Public Members</span>
            <strong>{members.length}名</strong>
            <p>公開中のメンバーだけを表示し、初見でも把握しやすい構成にしています。</p>
          </article>
          <article className="metric-card">
            <span>Leadership</span>
            <strong>{leadershipCount}名</strong>
            <p>部長と副部長は少し目立つカードとして見分けやすく表示しています。</p>
          </article>
          <article className="metric-card">
            <span>Profile Tone</span>
            <strong>親しみやすさ重視</strong>
            <p>長いVRC名でも崩れにくいよう、余白と改行のバランスを整えています。</p>
          </article>
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Cast List</span>
            <h2>公開中の部員一覧</h2>
          </div>
        </div>

        {members.length === 0 ? (
          <p className="empty-message">部員情報は現在準備中です。</p>
        ) : (
          <div className="member-grid">
            {members
              .slice()
              .sort((left, right) => left.sortOrder - right.sortOrder)
              .map((member) => (
                <article
                  key={member.id}
                  className={`member-card ${member.isLeadership ? 'is-leadership' : ''}`}
                >
                  <img
                    className="avatar-image"
                    src={member.avatarImageUrl || buildAvatarImage(member.avatarLabel, member.role)}
                    alt={`${member.vrcName}のアイコン画像`}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="member-card-header">
                    <div>
                      <span className="chip subtle-chip">{member.role}</span>
                      <h2>{member.vrcName}</h2>
                    </div>
                    <span className="status-badge">{member.status}</span>
                  </div>
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
              ))}
          </div>
        )}
      </section>
    </div>
  );
};
