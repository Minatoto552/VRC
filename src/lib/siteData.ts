import type { Activity, Member, SiteSettings } from './types';

export const defaultSettings: SiteSettings = {
  siteName: '2026年3月同期会 Event Café',
  siteDescription: 'VRChat上でカフェ風のBarイベントを企画・運営しています。',
  lotteryStatus: 'open',
  lotteryGuide: '抽選に参加する方は、VRChatで使用している名前を入力してください。',
  joinGuide: '説明会と軽い面接を通して、お互いに安心して活動できるか確認します。',
};

export const sampleActivities: Activity[] = [
  {
    id: 'sample-briefing',
    title: 'サンプル説明会（確認用）',
    kind: 'briefing',
    date: '2026-07-05',
    startTime: '21:00',
    endTime: '22:00',
    description: 'イベント部の活動内容を紹介します。',
    location: 'VRChat内 指定ワールド',
    audience: '入部希望者',
    notes: 'サンプルデータです。公開前に削除してください。',
    published: true,
  },
  {
    id: 'sample-cafe',
    title: 'サンプル Cafe Bar リハーサル',
    kind: 'rehearsal',
    date: '2026-07-12',
    startTime: '22:00',
    endTime: '23:30',
    description: '接客導線と抽選案内の確認を行います。',
    location: 'イベント部集合場所',
    audience: '部員',
    notes: 'サンプルデータです。',
    published: true,
  },
];

export const sampleMembers: Member[] = [
  {
    id: 'm1',
    vrcName: '部員01（サンプル）',
    iconUrl: '',
    role: '部長',
    assignment: '全体進行',
    bio: '公開前に実在する部員情報へ差し替えてください。',
    favoriteDrink: 'カフェラテ',
    status: '在籍中',
    published: true,
    sortOrder: 1,
  },
  {
    id: 'm2',
    vrcName: '部員02（サンプル）',
    iconUrl: '',
    role: '副部長',
    assignment: '案内',
    bio: 'サンプルの部員カードです。',
    favoriteDrink: 'ほうじ茶ラテ',
    status: '在籍中',
    published: true,
    sortOrder: 2,
  },
];

export const activityKindMeta = {
  'customer-event': ['☕', 'お客様向けイベント'],
  'member-meeting': ['📝', '部員向けミーティング'],
  briefing: ['📣', '説明会'],
  interview: ['🤝', '入部面接'],
  rehearsal: ['🎭', 'リハーサル'],
  other: ['✨', 'その他'],
} as const;
