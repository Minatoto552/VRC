import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

admin.initializeApp();

const db = admin.firestore();
const ADMIN_SHARED_PASSWORD = defineSecret('ADMIN_SHARED_PASSWORD');

type Entry = {
  id: string;
  displayName: string;
  normalizedName: string;
  eligible: boolean;
};

type AdminContext = {
  auth?: {
    uid?: string;
    token?: Record<string, unknown>;
  };
};

function normalizeVrcName(input: string) {
  return input.trim().replace(/[\s　]+/g, ' ').normalize('NFKC');
}

function canonicalVrcName(input: string) {
  return normalizeVrcName(input).toLocaleLowerCase('ja-JP');
}

function duplicateDocumentId(input: string) {
  return createHash('sha256').update(canonicalVrcName(input)).digest('hex');
}

function hashValue(input: string) {
  return createHash('sha256').update(input).digest();
}

async function audit(action: string, data: Record<string, unknown>) {
  await db.collection('adminAuditLogs').add({
    action,
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

function assertAdmin(context: AdminContext) {
  if (context.auth?.token?.admin !== true) {
    throw new HttpsError('permission-denied', '管理者権限が必要です');
  }
}

export const adminLogin = onCall(
  { region: 'asia-northeast1', secrets: [ADMIN_SHARED_PASSWORD] },
  async (request) => {
    const ip = request.rawRequest.ip ?? 'unknown';
    const rateLimitRef = db.collection('loginRateLimits').doc(createHash('sha256').update(ip).digest('hex'));
    const rateLimitSnapshot = await rateLimitRef.get();
    const now = Date.now();
    const rateLimit = rateLimitSnapshot.data() as { count?: number; lockedUntil?: number } | undefined;

    if (rateLimit?.lockedUntil && rateLimit.lockedUntil > now) {
      await audit('login_failed', { ip, reason: 'rate_limited' });
      throw new HttpsError('resource-exhausted', 'ログインできませんでした。時間を置いて再試行してください。');
    }

    const password = String(request.data?.password ?? '');
    const secret = ADMIN_SHARED_PASSWORD.value();
    const isValid =
      password.length > 0 && secret.length > 0 && timingSafeEqual(hashValue(password), hashValue(secret));

    if (!isValid) {
      const count = (rateLimit?.count ?? 0) + 1;
      await rateLimitRef.set(
        {
          count,
          lockedUntil: count >= 5 ? now + 10 * 60 * 1000 : 0,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      await audit('login_failed', { ip });
      throw new HttpsError('unauthenticated', 'ログインできませんでした。');
    }

    await rateLimitRef.delete().catch(() => undefined);

    const uid = 'shared-admin';
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    const token = await admin.auth().createCustomToken(uid, { admin: true });
    await audit('login_success', { uid });

    return { token };
  },
);

export const submitLotteryEntry = onCall({ region: 'asia-northeast1' }, async (request) => {
  const displayName = normalizeVrcName(String(request.data?.displayName ?? ''));

  if (!displayName) {
    throw new HttpsError('invalid-argument', 'VRC名を入力してください');
  }

  if (displayName.length > 40) {
    throw new HttpsError('invalid-argument', 'VRC名は40文字以内で入力してください');
  }

  const settingsSnapshot = await db.doc('siteSettings/public').get();

  if ((settingsSnapshot.data()?.lotteryStatus ?? 'open') !== 'open') {
    throw new HttpsError('failed-precondition', '現在は抽選受付を行っていません');
  }

  const entryRef = db.collection('lotteryEntries').doc(duplicateDocumentId(displayName));

  try {
    await entryRef.create({
      displayName,
      normalizedName: canonicalVrcName(displayName),
      eligible: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch {
    throw new HttpsError('already-exists', 'このVRC名はすでに登録されています');
  }

  return { ok: true };
});

export const runLottery = onCall({ region: 'asia-northeast1' }, async (request) => {
  assertAdmin(request);

  const winnerCount = Number(request.data?.winnerCount);

  if (!Number.isInteger(winnerCount) || winnerCount < 1) {
    throw new HttpsError('invalid-argument', '当選人数は1名以上にしてください');
  }

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(db.collection('lotteryEntries').where('eligible', '==', true));
    const entries: Entry[] = snapshot.docs.map((document) => ({
      id: document.id,
      ...(document.data() as Omit<Entry, 'id'>),
    }));

    if (winnerCount > entries.length) {
      throw new HttpsError('failed-precondition', '当選人数が候補者数を超えています');
    }

    const pool = [...entries];
    const winners: Entry[] = [];

    while (winners.length < winnerCount) {
      const index = randomInt(pool.length);
      winners.push(pool.splice(index, 1)[0]);
    }

    const drawRef = db.collection('lotteryDraws').doc();
    transaction.set(drawRef, {
      drawnAt: admin.firestore.FieldValue.serverTimestamp(),
      winnerCount,
      candidateCount: entries.length,
      winners: winners.map((winner) => ({ id: winner.id, displayName: winner.displayName })),
      executedBy: request.auth?.uid ?? 'unknown',
      notes: '',
    });
    transaction.set(db.collection('adminAuditLogs').doc(), {
      action: 'lottery_run',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      winnerCount,
      candidateCount: entries.length,
      executedBy: request.auth?.uid,
    });

    return {
      id: drawRef.id,
      winners: winners.map((winner) => ({ id: winner.id, displayName: winner.displayName })),
    };
  });
});

export const resetLotteryEntries = onCall({ region: 'asia-northeast1' }, async (request) => {
  assertAdmin(request);

  const snapshot = await db.collection('lotteryEntries').get();
  const batch = db.batch();

  snapshot.docs.forEach((document) => batch.delete(document.ref));
  batch.set(db.collection('adminAuditLogs').doc(), {
    action: 'entries_reset',
    count: snapshot.size,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    executedBy: request.auth?.uid,
  });

  await batch.commit();

  return { deleted: snapshot.size };
});
