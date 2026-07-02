export const activityKinds = [
  'public-event',
  'member-meeting',
  'briefing',
  'interview',
  'rehearsal',
  'other',
] as const;

export const lotteryStatuses = ['open', 'paused', 'closed'] as const;
export const runtimeModes = ['sample', 'emulator', 'firebase'] as const;

export type ActivityKind = (typeof activityKinds)[number];
export type LotteryStatus = (typeof lotteryStatuses)[number];
export type RuntimeMode = (typeof runtimeModes)[number];

export interface Activity {
  id: string;
  title: string;
  kind: ActivityKind;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  meetingPoint: string;
  targetAudience: string;
  notes: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemberProfile {
  id: string;
  vrcName: string;
  avatarLabel: string;
  avatarImageUrl: string;
  role: string;
  duties: string;
  bio: string;
  favoriteDrink: string;
  status: string;
  isPublic: boolean;
  sortOrder: number;
  isLeadership: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LotteryEntry {
  id: string;
  displayName: string;
  normalizedName: string;
  eligible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LotteryDraw {
  id: string;
  createdAt: string;
  candidateCount: number;
  winnerCount: number;
  winners: string[];
  executedBy: string;
  notes: string;
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  lotteryStatus: LotteryStatus;
  lotteryNotice: string;
  joinGuideNote: string;
  supportEmail: string;
  updatedAt: string;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  outcome: 'success' | 'failure';
  targetType: string;
  targetId: string;
  actorName: string;
  actorUid: string;
  message: string;
  createdAt: string;
}

export interface PublicContent {
  activities: Activity[];
  members: MemberProfile[];
  settings: SiteSettings;
}

export interface AdminContent extends PublicContent {
  entries: LotteryEntry[];
  draws: LotteryDraw[];
  audits: AdminAuditLog[];
  mode: RuntimeMode;
}
