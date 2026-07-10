import { z } from 'zod';

import { activityKinds, lotteryStatuses } from './models.js';

export const MAX_VRC_NAME_LENGTH = 32;

export const normalizeWhitespace = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

export const normalizeVrcName = (value: string): string =>
  normalizeWhitespace(value).toLocaleLowerCase('ja-JP');

export const isBlank = (value: string): boolean => normalizeWhitespace(value).length === 0;

export const lotteryEntrySchema = z.object({
  displayName: z
    .string()
    .transform(normalizeWhitespace)
    .refine((value) => value.length > 0, 'VRC名を入力してください')
    .refine(
      (value) => value.length <= MAX_VRC_NAME_LENGTH,
      `VRC名は${MAX_VRC_NAME_LENGTH}文字以内で入力してください`,
    ),
});

export const activitySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(80),
  kind: z.enum(activityKinds),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  description: z.string().min(1).max(500),
  meetingPoint: z.string().min(1).max(120),
  targetAudience: z.string().min(1).max(120),
  notes: z.string().max(400),
  isPublic: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const memberSchema = z.object({
  id: z.string().min(1),
  vrcName: z.string().min(1).max(40),
  avatarLabel: z.string().min(1).max(24),
  avatarImageUrl: z.string().max(500),
  role: z.string().min(1).max(40),
  duties: z.string().min(1).max(80),
  bio: z.string().min(1).max(220),
  favoriteDrink: z.string().min(1).max(40),
  status: z.string().min(1).max(30),
  isPublic: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
  isLeadership: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const siteSettingsSchema = z.object({
  siteName: z.string().min(1).max(80),
  siteDescription: z.string().min(1).max(220),
  lotteryStatus: z.enum(lotteryStatuses),
  lotteryNotice: z.string().min(1).max(260),
  joinGuideNote: z.string().min(1).max(260),
  supportEmail: z.email(),
  updatedAt: z.string().min(1),
});

export const winnerCountSchema = z.number().int().min(1, '当選人数は1名以上にしてください');

export const validateWinnerCount = (
  requestedCount: number,
  candidateCount: number,
): { ok: boolean; message?: string } => {
  const parsed = winnerCountSchema.safeParse(requestedCount);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message };
  }

  if (requestedCount > candidateCount) {
    return {
      ok: false,
      message: '候補者数を超える人数は指定できません',
    };
  }

  return { ok: true };
};
