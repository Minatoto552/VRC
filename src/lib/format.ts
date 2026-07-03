import type { Activity, ActivityKind, LotteryStatus } from '../../shared/models';

export const activityKindLabels: Record<ActivityKind, string> = {
  'public-event': 'お客様向けイベント',
  'member-meeting': '部員向けミーティング',
  briefing: '説明会',
  interview: '入部面接',
  rehearsal: 'リハーサル',
  other: 'その他',
};

export const activityKindIcons: Record<ActivityKind, string> = {
  'public-event': '☕',
  'member-meeting': '📝',
  briefing: '📋',
  interview: '🤝',
  rehearsal: '🎧',
  other: '✦',
};

export const lotteryStatusLabels: Record<LotteryStatus, string> = {
  open: '受付中',
  paused: '一時停止中',
  closed: '抽選終了',
};

export const formatDate = (date: string): string =>
  new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${date}T00:00:00`));

export const formatDateTime = (dateTime: string): string =>
  new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateTime));

export const formatTimeRange = (startTime: string, endTime: string): string =>
  `${startTime} - ${endTime}`;

export const findNextActivity = (activities: Activity[]): Activity | undefined => {
  const now = new Date();

  return [...activities]
    .filter((activity) => activity.isPublic)
    .sort((left, right) =>
      `${left.date}T${left.startTime}`.localeCompare(`${right.date}T${right.startTime}`),
    )
    .find((activity) => new Date(`${activity.date}T${activity.startTime}:00`) >= now);
};
