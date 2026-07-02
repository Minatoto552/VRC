import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { Activity } from '../../shared/models';
import { illustrations } from '../assets/illustrations';
import { PageIntro } from '../components/PageIntro';
import { buildCalendarGrid } from '../lib/calendar';
import {
  activityKindIcons,
  activityKindLabels,
  findNextActivity,
  formatDate,
  formatTimeRange,
} from '../lib/format';

interface SchedulePageProps {
  activities: Activity[];
}

export const SchedulePage = ({ activities }: SchedulePageProps) => {
  const publicActivities = activities.filter((activity) => activity.isPublic);
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedIsoDate, setSelectedIsoDate] = useState(() => {
    const nextActivity = findNextActivity(publicActivities);
    return nextActivity?.date ?? new Date().toISOString().slice(0, 10);
  });
  const grid = useMemo(
    () => buildCalendarGrid(anchorDate, publicActivities),
    [anchorDate, publicActivities],
  );
  const selectedActivities = publicActivities.filter((activity) => activity.date === selectedIsoDate);
  const nextActivity = findNextActivity(publicActivities);

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Activity Calendar"
        title="活動予定カレンダー"
        description="黒板メニューを見るような感覚で、次回の活動や月ごとの予定をひと目で確認できます。スマートフォンでも日付と内容が追いやすく、重要な予定が埋もれにくい配置に整えています。"
        imageSrc={illustrations.scheduleGuide}
        imageAlt="予定表を案内するカフェ風イラスト"
        caption="Schedule Scene"
        chips={[
          nextActivity ? `次回予定: ${formatDate(nextActivity.date)}` : '次回予定は現在調整中です',
          `公開中の予定: ${publicActivities.length}件`,
        ]}
      >
        <strong>今月の見どころ</strong>
        <p>気になる日付を選ぶと、その日の活動内容や集合場所、対象者を下のカードで確認できます。</p>
      </PageIntro>

      <section className="section-card">
        <div className="overview-stat-grid">
          <article className="metric-card">
            <span>Next Date</span>
            <strong>{nextActivity ? formatDate(nextActivity.date) : '調整中'}</strong>
            <p>次回予定が決まっている場合は、トップとカレンダー上部の両方から確認できます。</p>
          </article>
          <article className="metric-card">
            <span>Public Events</span>
            <strong>{publicActivities.length}件</strong>
            <p>公開対象の予定だけを表示し、一般の閲覧者が迷わないよう絞り込んでいます。</p>
          </article>
          <article className="metric-card">
            <span>How to Use</span>
            <strong>日付を選択</strong>
            <p>気になる日を押すだけで、下のカードが切り替わり、その日の内容を確認できます。</p>
          </article>
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Monthly Board</span>
            <h2>月ごとの活動予定</h2>
          </div>
          <div className="calendar-nav">
            <button
              type="button"
              className="icon-button"
              onClick={() => setAnchorDate(new Date(anchorDate.getFullYear(), anchorDate.getMonth() - 1, 1))}
            >
              <ChevronLeft size={18} />
              <span className="sr-only">前月</span>
            </button>
            <strong>
              {anchorDate.getFullYear()}年{anchorDate.getMonth() + 1}月
            </strong>
            <button
              type="button"
              className="icon-button"
              onClick={() => setAnchorDate(new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 1))}
            >
              <ChevronRight size={18} />
              <span className="sr-only">翌月</span>
            </button>
          </div>
        </div>

        <div className="next-activity-banner">
          <strong>次回の活動</strong>
          {nextActivity ? (
            <span>
              {formatDate(nextActivity.date)} / {nextActivity.title} /{' '}
              {formatTimeRange(nextActivity.startTime, nextActivity.endTime)}
            </span>
          ) : (
            <span>次回の活動は現在調整中です。</span>
          )}
        </div>

        <div className="calendar">
          <div className="calendar-weekdays">
            {['日', '月', '火', '水', '木', '金', '土'].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {grid.flat().map((day) => (
              <button
                key={day.isoDate}
                type="button"
                className={`calendar-day ${day.isCurrentMonth ? '' : 'is-muted'} ${
                  day.isToday ? 'is-today' : ''
                } ${day.activities.length > 0 ? 'has-activity' : ''} ${
                  selectedIsoDate === day.isoDate ? 'is-selected' : ''
                }`}
                onClick={() => setSelectedIsoDate(day.isoDate)}
              >
                <span>{day.date.getDate()}</span>
                {day.activities.length > 0 ? <small>{day.activities.length}件</small> : null}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Selected Day</span>
            <h2>{formatDate(selectedIsoDate)}</h2>
          </div>
        </div>

        {selectedActivities.length === 0 ? (
          <p className="empty-message">この日に公開中の活動予定はありません。</p>
        ) : (
          <div className="card-grid">
            {selectedActivities.map((activity) => (
              <article key={activity.id} className="info-card">
                <span className="chip subtle-chip">
                  {activityKindIcons[activity.kind]} {activityKindLabels[activity.kind]}
                </span>
                <h3>{activity.title}</h3>
                <p>{activity.description}</p>
                <dl className="stacked-details compact-details">
                  <div>
                    <dt>時間</dt>
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
                  <div>
                    <dt>備考</dt>
                    <dd>{activity.notes || '特記事項はありません。'}</dd>
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
