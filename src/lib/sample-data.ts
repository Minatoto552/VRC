import type { Activity, MemberProfile, PublicContent, SiteSettings } from '../../shared/models';
import {
  defaultJoinGuideNote,
  defaultSiteDescription,
  defaultSiteName,
} from './site-settings';

const timestamp = '2026-07-08T12:00:00.000Z';

export const sampleActivities: Activity[] = [
  {
    id: 'activity-01',
    title: '四季月家 プレオープンナイト',
    kind: 'public-event',
    date: '2026-03-14',
    startTime: '21:00',
    endTime: '23:00',
    description:
      '一般のお客様向けに、店内の雰囲気とキャストの接客フローを体験してもらう公開イベントです。',
    meetingPoint: 'VRChat ワールド入口前',
    targetAudience: '一般参加者',
    notes: 'ドレスコードはありません。表示名はVRC名でご参加ください。',
    isPublic: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: 'activity-02',
    title: '運営ミーティング',
    kind: 'member-meeting',
    date: '2026-03-10',
    startTime: '22:00',
    endTime: '23:00',
    description: '本番当日の導線確認と、キャストごとの役割整理を行う内部ミーティングです。',
    meetingPoint: 'スタッフ控室',
    targetAudience: '部員',
    notes: '公開サイトには表示しない内部向け予定です。',
    isPublic: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: 'activity-03',
    title: '入部説明会',
    kind: 'briefing',
    date: '2026-03-21',
    startTime: '20:30',
    endTime: '21:15',
    description: 'イベント部の活動内容や参加方法を案内する、入部希望者向けの説明会です。',
    meetingPoint: '四季月家 ラウンジ',
    targetAudience: '入部希望者',
    notes: '説明会後に軽い面接の案内を行います。',
    isPublic: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
];

export const sampleMembers: MemberProfile[] = [
  {
    id: 'member-01',
    vrcName: '部員01',
    avatarLabel: '01',
    avatarImageUrl: '',
    role: '部長',
    duties: '全体進行 / 接客設計',
    bio: '初めて来る方でも落ち着ける空気づくりを大切にしています。',
    favoriteDrink: 'カフェラテ',
    status: '在籍中',
    isPublic: true,
    sortOrder: 1,
    isLeadership: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: 'member-02',
    vrcName: '部員02',
    avatarLabel: '02',
    avatarImageUrl: '',
    role: '副部長',
    duties: '案内 / リハーサル調整',
    bio: '参加者もキャストも安心できる運営導線を整えるのが担当です。',
    favoriteDrink: 'ほうじ茶ラテ',
    status: '在籍中',
    isPublic: true,
    sortOrder: 2,
    isLeadership: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: 'member-03',
    vrcName: '部員03',
    avatarLabel: '03',
    avatarImageUrl: '',
    role: '技術担当',
    duties: '告知 / 表示演出',
    bio: '見やすいサイトと、イベント当日の演出サポートを担当しています。',
    favoriteDrink: 'アイスコーヒー',
    status: '在籍中',
    isPublic: true,
    sortOrder: 3,
    isLeadership: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
];

export const sampleSettings: SiteSettings = {
  siteName: defaultSiteName,
  siteDescription: defaultSiteDescription,
  lotteryStatus: 'closed',
  lotteryNotice: '現在、抽選受付は使用していません。',
  joinGuideNote: defaultJoinGuideNote,
  supportEmail: 'cast@example.com',
  updatedAt: timestamp,
};

export const samplePublicContent: PublicContent = {
  activities: sampleActivities.filter((activity) => activity.isPublic),
  members: sampleMembers.filter((member) => member.isPublic),
  settings: sampleSettings,
};
