import type {
  Activity,
  MemberProfile,
  PublicContent,
  SiteSettings,
} from '../../shared/models';

const timestamp = '2026-06-29T12:00:00.000Z';

export const sampleActivities: Activity[] = [
  {
    id: 'activity-01',
    title: 'Cafe Night Preview',
    kind: 'public-event',
    date: '2026-03-14',
    startTime: '21:00',
    endTime: '23:00',
    description:
      '一般のお客様向けに、落ち着いた夜のカフェBarの雰囲気を体験してもらう案内イベントです。',
    meetingPoint: 'VRCワールド入口',
    targetAudience: '一般参加者',
    notes: 'ドレスコードはありません。抽選参加の案内も当日に行います。',
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
    description: '本番日の進行確認と案内フローの最終調整を行います。',
    meetingPoint: 'スタッフ控室',
    targetAudience: '部員',
    notes: '公開サイトでは非表示です。',
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
    description: 'イベント部の活動方針と入部方法を案内する説明会です。',
    meetingPoint: 'Event Cafe ラウンジ',
    targetAudience: '入部希望者',
    notes: '説明会後に軽い面接の時間を設けます。',
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
    duties: '全体進行 / 運営調整',
    bio: '初めての方でも安心して過ごせる、やわらかな空間づくりを目指しています。',
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
    duties: '広報 / リハーサル調整',
    bio: '参加者のみなさんが迷わず楽しめる導線づくりを担当しています。',
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
    duties: '配信 / 演出調整',
    bio: 'カフェらしい照明と見やすい案内表示を支える演出まわりを整えています。',
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
  siteName: '2026年3月同期会 Event Cafe',
  siteDescription:
    'VRChat上で開催する、あたたかく親しみやすいカフェBarイベントの公開サイトです。',
  lotteryStatus: 'open',
  lotteryNotice:
    '抽選に参加する方は、VRChatで使用している名前を入力してください。個人情報は入力しないでください。',
  joinGuideNote:
    '説明会後に軽い面接を予定しています。詳細は運営からの案内を確認してください。',
  supportEmail: 'event-cafe@example.com',
  updatedAt: timestamp,
};

export const samplePublicContent: PublicContent = {
  activities: sampleActivities.filter((activity) => activity.isPublic),
  members: sampleMembers.filter((member) => member.isPublic),
  settings: sampleSettings,
};
