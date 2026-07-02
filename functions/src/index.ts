import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2/options';

import { drawWinners } from '../../shared/lottery.js';
import type {
  Activity,
  AdminContent,
  AdminAuditLog,
  LotteryDraw,
  LotteryEntry,
  MemberProfile,
  PublicContent,
  SiteSettings,
} from '../../shared/models.js';
import {
  activitySchema,
  lotteryEntrySchema,
  memberSchema,
  normalizeVrcName,
  siteSettingsSchema,
  validateWinnerCount,
} from '../../shared/validation.js';

initializeApp();
setGlobalOptions({ region: 'asia-northeast1', maxInstances: 10 });

const db = getFirestore();
const auth = getAuth();
const ADMIN_SHARED_PASSWORD = defineSecret('ADMIN_SHARED_PASSWORD');

const SETTINGS_DOC = db.collection('siteSettings').doc('public');
const LOCK_DOC = db.collection('siteSettings').doc('runtimeLock');
const isFunctionsEmulator = process.env['FUNCTIONS_EMULATOR'] === 'true';
const nowIso = (): string => new Date().toISOString();

const emulatorDefaultSettings: SiteSettings = {
  siteName: '2026年3月同期会 Event Cafe',
  siteDescription:
    'VRChat上で開催する、あたたかく親しみやすいカフェBarイベントのローカル確認用設定です。',
  lotteryStatus: 'open',
  lotteryNotice:
    '抽選に参加する方は、VRChatで使用している名前を入力してください。個人情報は入力しないでください。',
  joinGuideNote:
    '説明会の日程や入部の流れは、活動予定カレンダーと入部案内から確認できます。',
  supportEmail: 'event-cafe@example.com',
  updatedAt: nowIso(),
};

const safePasswordEquals = (receivedPassword: string, expectedPassword: string): boolean => {
  const expectedHash = createHash('sha256').update(expectedPassword).digest();
  const receivedHash = createHash('sha256').update(receivedPassword).digest();

  return timingSafeEqual(expectedHash, receivedHash);
};

const hashValue = (value: string): string => createHash('sha256').update(value).digest('hex');

const getAttemptKey = (ipAddress: string): string => hashValue(ipAddress || 'unknown-ip');

const auditLogCollection = db.collection('adminAuditLogs');

const writeAuditLog = async (
  partial: Omit<AdminAuditLog, 'id' | 'createdAt'>,
): Promise<void> => {
  const payload = {
    ...partial,
    createdAt: nowIso(),
  };

  await auditLogCollection.add(payload);
};

const assertAdmin = (request: CallableRequest<unknown>): { uid: string } => {
  if (request.auth?.token['admin'] !== true) {
    throw new HttpsError('permission-denied', '管理者のみ利用できます。');
  }

  return { uid: request.auth.uid };
};

const acquireLotteryLock = async (actorUid: string): Promise<void> => {
  await db.runTransaction(async (transaction) => {
    const lockSnapshot = await transaction.get(LOCK_DOC);

    if (lockSnapshot.exists) {
      const expiresAt = lockSnapshot.data()?.expiresAt;
      if (typeof expiresAt === 'string' && new Date(expiresAt) > new Date()) {
        throw new HttpsError('failed-precondition', '抽選処理中です。完了後に再試行してください。');
      }
    }

    transaction.set(LOCK_DOC, {
      actorUid,
      createdAt: nowIso(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
  });
};

const releaseLotteryLock = async (): Promise<void> => {
  const lockSnapshot = await LOCK_DOC.get();
  if (lockSnapshot.exists) {
    await LOCK_DOC.delete();
  }
};

const deleteDocs = async (collectionName: string): Promise<number> => {
  const snapshot = await db.collection(collectionName).get();

  if (snapshot.empty) {
    return 0;
  }

  for (let index = 0; index < snapshot.docs.length; index += 400) {
    const batch = db.batch();
    snapshot.docs.slice(index, index + 400).forEach((document) => {
      batch.delete(document.ref);
    });
    await batch.commit();
  }

  return snapshot.size;
};

const readPublicContent = async (): Promise<PublicContent> => {
  const [activitiesSnapshot, membersSnapshot, settingsSnapshot] = await Promise.all([
    db.collection('activities').where('isPublic', '==', true).orderBy('date', 'asc').get(),
    db.collection('members').where('isPublic', '==', true).orderBy('sortOrder', 'asc').get(),
    SETTINGS_DOC.get(),
  ]);

  return {
    activities: activitiesSnapshot.docs.map((document) => ({
      id: document.id,
      ...(document.data() as Omit<Activity, 'id'>),
    })),
    members: membersSnapshot.docs.map((document) => ({
      id: document.id,
      ...(document.data() as Omit<MemberProfile, 'id'>),
    })),
    settings: settingsSnapshot.exists
      ? ({ ...emulatorDefaultSettings, ...(settingsSnapshot.data() as Partial<SiteSettings>) } satisfies SiteSettings)
      : emulatorDefaultSettings,
  };
};

const readAdminContent = async (): Promise<AdminContent> => {
  const [activitiesSnapshot, membersSnapshot, settingsSnapshot, entriesSnapshot, drawsSnapshot, auditsSnapshot] =
    await Promise.all([
      db.collection('activities').orderBy('date', 'asc').get(),
      db.collection('members').orderBy('sortOrder', 'asc').get(),
      SETTINGS_DOC.get(),
      db.collection('lotteryEntries').orderBy('createdAt', 'desc').get(),
      db.collection('lotteryDraws').orderBy('createdAt', 'desc').get(),
      db.collection('adminAuditLogs').orderBy('createdAt', 'desc').limit(12).get(),
    ]);

  return {
    activities: activitiesSnapshot.docs.map((document) => ({
      id: document.id,
      ...(document.data() as Omit<Activity, 'id'>),
    })),
    members: membersSnapshot.docs.map((document) => ({
      id: document.id,
      ...(document.data() as Omit<MemberProfile, 'id'>),
    })),
    settings: settingsSnapshot.exists
      ? ({ ...emulatorDefaultSettings, ...(settingsSnapshot.data() as Partial<SiteSettings>) } satisfies SiteSettings)
      : emulatorDefaultSettings,
    entries: entriesSnapshot.docs.map((document) => ({
      id: document.id,
      ...(document.data() as Omit<LotteryEntry, 'id'>),
    })),
    draws: drawsSnapshot.docs.map((document) => ({
      id: document.id,
      ...(document.data() as Omit<LotteryDraw, 'id'>),
    })),
    audits: auditsSnapshot.docs.map((document) => ({
      id: document.id,
      ...(document.data() as Omit<AdminAuditLog, 'id'>),
    })),
    mode: isFunctionsEmulator ? 'emulator' : 'firebase',
  };
};

export const getPublicContent = onCall(async () => readPublicContent());

export const getAdminContent = onCall(async (request) => {
  assertAdmin(request);
  return readAdminContent();
});

export const adminLogin = onCall({ secrets: [ADMIN_SHARED_PASSWORD] }, async (request) => {
  const password = String(request.data?.password ?? '');
  const ipAddress = request.rawRequest.ip ?? 'unknown-ip';
  const attemptRef = db.collection('adminLoginAttempts').doc(getAttemptKey(ipAddress));
  const attemptSnapshot = await attemptRef.get();
  const now = new Date();
  const lockedUntil = attemptSnapshot.data()?.lockedUntil;

  if (typeof lockedUntil === 'string' && new Date(lockedUntil) > now) {
    await writeAuditLog({
      action: 'ログイン失敗',
      outcome: 'failure',
      targetType: 'auth',
      targetId: 'admin-login',
      actorName: 'anonymous',
      actorUid: 'anonymous',
      message: '連続失敗により一時ロック中のアクセスを拒否しました。',
    });
    throw new HttpsError('permission-denied', '認証に失敗しました。しばらく待ってから再試行してください。');
  }

  const secretValue = ADMIN_SHARED_PASSWORD.value();
  const isValid = safePasswordEquals(password, secretValue);

  if (!isValid) {
    const nextFailureCount = Number(attemptSnapshot.data()?.failureCount ?? 0) + 1;
    const shouldLock = nextFailureCount >= 5;

    await attemptRef.set(
      {
        failureCount: shouldLock ? 0 : nextFailureCount,
        lockedUntil: shouldLock ? new Date(Date.now() + 10 * 60_000).toISOString() : null,
        updatedAt: nowIso(),
      },
      { merge: true },
    );

    await writeAuditLog({
      action: 'ログイン失敗',
      outcome: 'failure',
      targetType: 'auth',
      targetId: 'admin-login',
      actorName: 'anonymous',
      actorUid: 'anonymous',
      message: '管理パスワードの照合に失敗しました。',
    });

    throw new HttpsError('permission-denied', '認証に失敗しました。しばらく待ってから再試行してください。');
  }

  await attemptRef.delete();
  const customToken = await auth.createCustomToken('event-cafe-admin', { admin: true });

  await writeAuditLog({
    action: 'ログイン成功',
    outcome: 'success',
    targetType: 'auth',
    targetId: 'admin-login',
    actorName: 'event-cafe-admin',
    actorUid: 'event-cafe-admin',
    message: '管理者ログインが成功しました。',
  });

  return { customToken };
});

export const submitLotteryEntry = onCall(async (request) => {
  const parsed = lotteryEntrySchema.safeParse(request.data);

  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message ?? '入力内容を確認してください。');
  }

  const settingsSnapshot = await SETTINGS_DOC.get();
  const settings = settingsSnapshot.exists
    ? (settingsSnapshot.data() as SiteSettings)
    : isFunctionsEmulator
      ? emulatorDefaultSettings
      : null;

  if (!settings || settings.lotteryStatus !== 'open') {
    throw new HttpsError('failed-precondition', '現在は抽選受付を行っていません');
  }

  const displayName = parsed.data.displayName;
  const normalizedName = normalizeVrcName(displayName);
  const entryId = hashValue(normalizedName);
  const entryRef = db.collection('lotteryEntries').doc(entryId);
  const timestamp = nowIso();

  await db.runTransaction(async (transaction) => {
    const existingEntry = await transaction.get(entryRef);
    if (existingEntry.exists) {
      throw new HttpsError('already-exists', 'このVRC名はすでに登録されています');
    }

    const entry: LotteryEntry = {
      id: entryId,
      displayName,
      normalizedName,
      eligible: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    transaction.set(entryRef, entry);
  });

  return { ok: true };
});

export const runLottery = onCall(async (request) => {
  const { uid } = assertAdmin(request);
  const requestedCount = Number(request.data?.winnerCount ?? 0);

  await acquireLotteryLock(uid);

  try {
    const entrySnapshots = await db.collection('lotteryEntries').where('eligible', '==', true).get();
    const entries = entrySnapshots.docs.map((document) => document.data() as LotteryEntry);
    const validation = validateWinnerCount(requestedCount, entries.length);

    if (!validation.ok) {
      throw new HttpsError('invalid-argument', validation.message ?? '当選人数を確認してください。');
    }

    const winners = drawWinners(entries, requestedCount, (maxExclusive) => randomInt(maxExclusive));
    const drawRef = db.collection('lotteryDraws').doc();
    const draw: LotteryDraw = {
      id: drawRef.id,
      createdAt: nowIso(),
      candidateCount: entries.length,
      winnerCount: requestedCount,
      winners: winners.map((winner) => winner.displayName),
      executedBy: uid,
      notes: 'Cloud Functionsで抽選を実行しました。',
    };

    await drawRef.set(draw);
    await writeAuditLog({
      action: '抽選実行',
      outcome: 'success',
      targetType: 'lotteryDraws',
      targetId: drawRef.id,
      actorName: uid,
      actorUid: uid,
      message: `${requestedCount}名の抽選を実行しました。`,
    });

    return draw;
  } finally {
    await releaseLotteryLock();
  }
});

export const resetLotteryEntries = onCall(async (request) => {
  const { uid } = assertAdmin(request);
  const deletedCount = await deleteDocs('lotteryEntries');

  await writeAuditLog({
    action: '候補者全削除',
    outcome: 'success',
    targetType: 'lotteryEntries',
    targetId: 'all',
    actorName: uid,
    actorUid: uid,
    message: `${deletedCount}件の候補者を削除しました。`,
  });

  return { ok: true };
});

export const updateLotteryEntryEligibility = onCall(async (request) => {
  const { uid } = assertAdmin(request);
  const entryId = String(request.data?.entryId ?? '');
  const eligible = Boolean(request.data?.eligible);

  if (!entryId) {
    throw new HttpsError('invalid-argument', '候補者IDが不正です。');
  }

  await db.collection('lotteryEntries').doc(entryId).update({
    eligible,
    updatedAt: nowIso(),
  });

  await writeAuditLog({
    action: '抽選対象変更',
    outcome: 'success',
    targetType: 'lotteryEntries',
    targetId: entryId,
    actorName: uid,
    actorUid: uid,
    message: eligible ? '候補者を抽選対象に戻しました。' : '候補者を抽選対象外にしました。',
  });

  return { ok: true };
});

export const deleteLotteryEntry = onCall(async (request) => {
  const { uid } = assertAdmin(request);
  const entryId = String(request.data?.entryId ?? '');

  if (!entryId) {
    throw new HttpsError('invalid-argument', '候補者IDが不正です。');
  }

  await db.collection('lotteryEntries').doc(entryId).delete();
  await writeAuditLog({
    action: '候補者削除',
    outcome: 'success',
    targetType: 'lotteryEntries',
    targetId: entryId,
    actorName: uid,
    actorUid: uid,
    message: '候補者を個別削除しました。',
  });

  return { ok: true };
});

export const deleteLotteryDraw = onCall(async (request) => {
  const { uid } = assertAdmin(request);
  const drawId = String(request.data?.drawId ?? '');

  if (!drawId) {
    throw new HttpsError('invalid-argument', '履歴IDが不正です。');
  }

  await db.collection('lotteryDraws').doc(drawId).delete();
  await writeAuditLog({
    action: '抽選履歴削除',
    outcome: 'success',
    targetType: 'lotteryDraws',
    targetId: drawId,
    actorName: uid,
    actorUid: uid,
    message: '抽選履歴を削除しました。',
  });

  return { ok: true };
});

export const upsertActivity = onCall(async (request) => {
  const { uid } = assertAdmin(request);
  const parsed = activitySchema.safeParse(request.data?.activity);

  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message ?? '活動予定を確認してください。');
  }

  const activity = parsed.data as Activity;
  await db.collection('activities').doc(activity.id).set(activity, { merge: true });
  await writeAuditLog({
    action: '活動予定変更',
    outcome: 'success',
    targetType: 'activities',
    targetId: activity.id,
    actorName: uid,
    actorUid: uid,
    message: `活動予定「${activity.title}」を保存しました。`,
  });

  return { ok: true };
});

export const deleteActivity = onCall(async (request) => {
  const { uid } = assertAdmin(request);
  const activityId = String(request.data?.activityId ?? '');

  if (!activityId) {
    throw new HttpsError('invalid-argument', '活動IDが不正です。');
  }

  await db.collection('activities').doc(activityId).delete();
  await writeAuditLog({
    action: '活動予定変更',
    outcome: 'success',
    targetType: 'activities',
    targetId: activityId,
    actorName: uid,
    actorUid: uid,
    message: '活動予定を削除しました。',
  });

  return { ok: true };
});

export const upsertMember = onCall(async (request) => {
  const { uid } = assertAdmin(request);
  const parsed = memberSchema.safeParse(request.data?.member);

  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message ?? '部員情報を確認してください。');
  }

  const member = parsed.data as MemberProfile;
  await db.collection('members').doc(member.id).set(member, { merge: true });
  await writeAuditLog({
    action: '部員情報変更',
    outcome: 'success',
    targetType: 'members',
    targetId: member.id,
    actorName: uid,
    actorUid: uid,
    message: `部員「${member.vrcName}」を保存しました。`,
  });

  return { ok: true };
});

export const deleteMember = onCall(async (request) => {
  const { uid } = assertAdmin(request);
  const memberId = String(request.data?.memberId ?? '');

  if (!memberId) {
    throw new HttpsError('invalid-argument', '部員IDが不正です。');
  }

  await db.collection('members').doc(memberId).delete();
  await writeAuditLog({
    action: '部員情報変更',
    outcome: 'success',
    targetType: 'members',
    targetId: memberId,
    actorName: uid,
    actorUid: uid,
    message: '部員情報を削除しました。',
  });

  return { ok: true };
});

export const updateSiteSettings = onCall(async (request) => {
  const { uid } = assertAdmin(request);
  const parsed = siteSettingsSchema.safeParse(request.data?.settings);

  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message ?? '設定内容を確認してください。');
  }

  const settings = parsed.data as SiteSettings;
  await SETTINGS_DOC.set(settings, { merge: true });
  await writeAuditLog({
    action: '受付状態変更',
    outcome: 'success',
    targetType: 'siteSettings',
    targetId: 'public',
    actorName: uid,
    actorUid: uid,
    message: `抽選受付状態を${settings.lotteryStatus}へ更新しました。`,
  });

  return { ok: true };
});
