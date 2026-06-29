import { useEffect, useMemo, useState } from 'react';
import { NextActivity } from '../components/NextActivity';
import { getPublicActivities } from '../lib/dataService';
import { activityKindMeta } from '../lib/siteData';
import type { Activity } from '../lib/types';

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export function Calendar() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    void getPublicActivities().then(setActivities);
  }, []);

  const days = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const monthDays: (string | null)[] = Array(firstDay.getDay()).fill(null);

    for (let day = 1; day <= new Date(year, monthIndex + 1, 0).getDate(); day += 1) {
      monthDays.push(toDateKey(new Date(year, monthIndex, day)));
    }

    return monthDays;
  }, [month]);

  const activitiesByDate = (date: string) => activities.filter((activity) => activity.date === date);
  const selectedActivities = selectedDate ? activitiesByDate(selectedDate) : [];
  const today = toDateKey(new Date());

  return (
    <section>
      <NextActivity activities={activities} />
      <div className="card">
        <div className="calendar-head">
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>前月</button>
          <h1>
            {month.getFullYear()}年 {month.getMonth() + 1}月
          </h1>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>翌月</button>
        </div>
        <div className="calendar" aria-label="活動予定カレンダー">
          {['日', '月', '火', '水', '木', '金', '土'].map((weekday) => (
            <b key={weekday}>{weekday}</b>
          ))}
          {days.map((date, index) => (
            <button
              key={date ?? `blank-${index}`}
              disabled={!date}
              className={date === today ? 'today' : ''}
              onClick={() => date && setSelectedDate(date)}
            >
              {date && (
                <>
                  <span>{Number(date.slice(-2))}</span>
                  {activitiesByDate(date)
                    .slice(0, 2)
                    .map((activity) => (
                      <small key={activity.id}>
                        {activityKindMeta[activity.kind][0]} {activity.title}
                      </small>
                    ))}
                </>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="card">
        <h2>{selectedDate || '日付を選択'} の活動</h2>
        {selectedActivities.length === 0 ? (
          <p>この日の公開活動はありません。</p>
        ) : (
          selectedActivities.map((activity) => (
            <article key={activity.id} className="mini">
              <b>
                {activityKindMeta[activity.kind][0]} {activityKindMeta[activity.kind][1]}
              </b>
              <h3>{activity.title}</h3>
              <p>
                {activity.startTime}〜{activity.endTime} / {activity.location}
              </p>
              <p>{activity.description}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
