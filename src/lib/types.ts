export type ActivityKind =
  | 'customer-event'
  | 'member-meeting'
  | 'briefing'
  | 'interview'
  | 'rehearsal'
  | 'other';

export type ReceptionStatus = 'open' | 'paused' | 'closed';

export type Activity = {
  id: string;
  title: string;
  kind: ActivityKind;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  location: string;
  audience: string;
  notes: string;
  published: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type Member = {
  id: string;
  vrcName: string;
  iconUrl: string;
  role: string;
  assignment: string;
  bio: string;
  favoriteDrink: string;
  status: string;
  published: boolean;
  sortOrder: number;
};

export type SiteSettings = {
  siteName: string;
  siteDescription: string;
  lotteryStatus: ReceptionStatus;
  lotteryGuide: string;
  joinGuide: string;
};

export type LotteryEntry = {
  id: string;
  displayName: string;
  normalizedName: string;
  eligible: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type LotteryDraw = {
  id: string;
  drawnAt?: unknown;
  winners: { id: string; displayName: string }[];
  winnerCount: number;
  candidateCount: number;
  executedBy: string;
  notes: string;
};
