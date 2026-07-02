import type { Activity } from '../../shared/models';

export interface CalendarDay {
  date: Date;
  isoDate: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  activities: Activity[];
}

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const buildCalendarGrid = (anchor: Date, activities: Activity[]): CalendarDay[][] => {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());

  const todayIso = toIsoDate(new Date());
  const rows: CalendarDay[][] = [];

  for (let week = 0; week < 6; week += 1) {
    const row: CalendarDay[] = [];

    for (let day = 0; day < 7; day += 1) {
      const currentDate = new Date(calendarStart);
      currentDate.setDate(calendarStart.getDate() + week * 7 + day);
      const isoDate = toIsoDate(currentDate);

      row.push({
        date: currentDate,
        isoDate,
        isCurrentMonth: currentDate.getMonth() === anchor.getMonth(),
        isToday: isoDate === todayIso,
        activities: activities.filter((activity) => activity.date === isoDate),
      });
    }

    rows.push(row);
  }

  return rows;
};
