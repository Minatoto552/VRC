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
        description="運営の顔ぶれやプロフィールカードを見ながら、役職や担当、この人となりを知ってもらえるように整理しました。部長と副部長は少し目を引く見せ方にしつつ、全員が同じ空気感で並ぶようまとめています。"
        imageSrc={illustrations.membersGuide}
        imageAlt="部員紹介を案内するカフェ風イラスト"
        caption="Members Wall"
        chips={[`公開中の部員: ${members.length}名`, `リーダー表示: ${leadershipCount}名`]}
        reverse
      >
        <strong>プロフィールの見かた</strong>
        <p>役職、担当、好きな飲み物まで並べて表示し、初見でも雰囲気をつかみやすいカード構成にしています。</p>
      </PageIntro>

      <section className="section-card">
        <div className="overview-stat-grid">
          <article className="metric-card">
            <span>Public Members</span>
            <strong>{members.length}名</strong>
            <p>公開中の部員だけを表示し、役職や担当がすぐ分かる構成にしています。</p>
          </article>
          <article className="metric-card">
            <span>Leadership</span>
            <strong>{leadershipCount}名</strong>
            <p>部長と副部長は少し強めのカードで見せ、チームの中心が把握しやすくなっています。</p>
          </article>
          <article className="metric-card">
            <span>Profile Tone</span>
            <strong>人柄重視</strong>
            <p>役割だけでなく、短い自己紹介や好きな飲み物も添えて親しみやすさを残しています。</p>
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
