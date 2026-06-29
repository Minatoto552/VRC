import type { Activity } from '../lib/types';

export function nextActivity(activities: Activity[]) {
  const today = new Date().toISOString().slice(0, 10);

  return activities
    .filter((activity) => activity.published && activity.date >= today)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0];
}

export function NextActivity({ activities }: { activities: Activity[] }) {
  const activity = nextActivity(activities);

  return (
    <section className="card next" id="next">
      <h2>次回の活動予定</h2>
      {!activity ? (
        <p>次回の活動は現在調整中です。</p>
      ) : (
        <dl className="details">
          <dt>活動名</dt>
          <dd>{activity.title}</dd>
          <dt>開催日</dt>
          <dd>{activity.date}</dd>
          <dt>時間</dt>
          <dd>
            {activity.startTime}〜{activity.endTime}
          </dd>
          <dt>活動内容</dt>
          <dd>{activity.description}</dd>
          <dt>対象者</dt>
          <dd>{activity.audience}</dd>
          <dt>集合場所</dt>
          <dd>{activity.location}</dd>
        </dl>
      )}
    </section>
  );
}
