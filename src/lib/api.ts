import { httpsCallable } from 'firebase/functions';
import {
  browserSessionPersistence,
  setPersistence,
  signInWithCustomToken,
  signOut,
  type Auth,
} from 'firebase/auth';
import type { Functions } from 'firebase/functions';

import type {
  Activity,
  AdminContent,
  LotteryDraw,
  MemberProfile,
  PublicContent,
  SiteSettings,
} from '../../shared/models';
import { sampleActivities, sampleMembers, samplePublicContent, sampleSettings } from './sample-data';
import { firebaseServices, runtimeMode } from './firebase';

interface FirebaseRuntime {
  auth: Auth;
  functions: Functions;
}

const FIREBASE_READ_TIMEOUT_MS = 7000;
const FIREBASE_WRITE_TIMEOUT_MS = 12000;

const buildConnectionMessage = (actionLabel: string): string =>
  runtimeMode === 'emulator'
    ? `Firebase Emulator に接続できませんでした。${actionLabel}を続けるには \`npm run emulators\` を起動してください。`
    : `Firebase に接続できませんでした。${actionLabel}を続けるには Firebase の設定を確認してください。`;

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  actionLabel: string,
): Promise<T> => {
  let timerId: ReturnType<typeof window.setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timerId = window.setTimeout(() => {
          reject(new Error(buildConnectionMessage(actionLabel)));
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    throw error instanceof Error ? error : new Error(buildConnectionMessage(actionLabel));
  } finally {
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
    }
  }
};

const ensureFirebase = (): FirebaseRuntime => {
  if (!firebaseServices.auth || !firebaseServices.functions) {
    throw new Error('Firebase の設定が見つかりません。.env.local の内容を確認してください。');
  }

  return { auth: firebaseServices.auth, functions: firebaseServices.functions };
};

const mergeEmulatorPublicContent = (content: PublicContent): PublicContent => ({
  activities: content.activities.length > 0 ? content.activities : samplePublicContent.activities,
  members: content.members.length > 0 ? content.members : samplePublicContent.members,
  settings: {
    ...samplePublicContent.settings,
    ...content.settings,
  },
});

export const loadPublicContent = async (): Promise<PublicContent> => {
  if (runtimeMode === 'sample') {
    return samplePublicContent;
  }

  const { functions } = ensureFirebase();
  const callable = httpsCallable<undefined, PublicContent>(functions, 'getPublicContent');
  const result = await withTimeout(callable(), FIREBASE_READ_TIMEOUT_MS, '公開データの読み込み');

  return runtimeMode === 'emulator' ? mergeEmulatorPublicContent(result.data) : result.data;
};

export const loadAdminContent = async (): Promise<AdminContent> => {
  if (runtimeMode === 'sample') {
    return {
      activities: sampleActivities,
      members: sampleMembers,
      settings: sampleSettings,
      entries: [],
      draws: [],
      audits: [],
      mode: runtimeMode,
    };
  }

  const { functions } = ensureFirebase();
  const callable = httpsCallable<undefined, AdminContent>(functions, 'getAdminContent');
  const result = await withTimeout(callable(), FIREBASE_READ_TIMEOUT_MS, '管理データの読み込み');
  return result.data;
};

export const submitLotteryEntry = async (displayName: string): Promise<void> => {
  if (runtimeMode === 'sample') {
    void displayName;
    return;
  }

  const { functions } = ensureFirebase();
  const callable = httpsCallable<{ displayName: string }, { ok: boolean }>(
    functions,
    'submitLotteryEntry',
  );
  await withTimeout(callable({ displayName }), FIREBASE_WRITE_TIMEOUT_MS, '抽選受付');
};

export const loginAsAdmin = async (password: string): Promise<void> => {
  const { auth, functions } = ensureFirebase();
  const callable = httpsCallable<{ password: string }, { customToken: string }>(
    functions,
    'adminLogin',
  );
  const result = await withTimeout(callable({ password }), FIREBASE_WRITE_TIMEOUT_MS, '管理者ログイン');
  await setPersistence(auth, browserSessionPersistence);
  await signInWithCustomToken(auth, result.data.customToken);
};

export const logoutAdmin = async (): Promise<void> => {
  const { auth } = ensureFirebase();
  await signOut(auth);
};

export const runLottery = async (winnerCount: number): Promise<LotteryDraw> => {
  const { functions } = ensureFirebase();
  const callable = httpsCallable<{ winnerCount: number }, LotteryDraw>(functions, 'runLottery');
  const result = await withTimeout(callable({ winnerCount }), FIREBASE_WRITE_TIMEOUT_MS, '抽選実行');

  return result.data;
};

export const resetLotteryEntries = async (): Promise<void> => {
  const { functions } = ensureFirebase();
  const callable = httpsCallable(functions, 'resetLotteryEntries');
  await withTimeout(callable(), FIREBASE_WRITE_TIMEOUT_MS, '候補者一覧の全削除');
};

export const updateLotteryEntryEligibility = async (
  entryId: string,
  eligible: boolean,
): Promise<void> => {
  const { functions } = ensureFirebase();
  const callable = httpsCallable<{ entryId: string; eligible: boolean }, { ok: boolean }>(
    functions,
    'updateLotteryEntryEligibility',
  );
  await withTimeout(
    callable({ entryId, eligible }),
    FIREBASE_WRITE_TIMEOUT_MS,
    '抽選対象の切り替え',
  );
};

export const deleteLotteryEntry = async (entryId: string): Promise<void> => {
  const { functions } = ensureFirebase();
  const callable = httpsCallable<{ entryId: string }, { ok: boolean }>(
    functions,
    'deleteLotteryEntry',
  );
  await withTimeout(callable({ entryId }), FIREBASE_WRITE_TIMEOUT_MS, '候補者削除');
};

export const deleteLotteryDraw = async (drawId: string): Promise<void> => {
  const { functions } = ensureFirebase();
  const callable = httpsCallable<{ drawId: string }, { ok: boolean }>(
    functions,
    'deleteLotteryDraw',
  );
  await withTimeout(callable({ drawId }), FIREBASE_WRITE_TIMEOUT_MS, '抽選履歴の削除');
};

export const upsertActivity = async (activity: Activity): Promise<void> => {
  const { functions } = ensureFirebase();
  const callable = httpsCallable<{ activity: Activity }, { ok: boolean }>(
    functions,
    'upsertActivity',
  );
  await withTimeout(callable({ activity }), FIREBASE_WRITE_TIMEOUT_MS, '活動予定の保存');
};

export const deleteActivity = async (activityId: string): Promise<void> => {
  const { functions } = ensureFirebase();
  const callable = httpsCallable<{ activityId: string }, { ok: boolean }>(
    functions,
    'deleteActivity',
  );
  await withTimeout(callable({ activityId }), FIREBASE_WRITE_TIMEOUT_MS, '活動予定の削除');
};

export const upsertMember = async (member: MemberProfile): Promise<void> => {
  const { functions } = ensureFirebase();
  const callable = httpsCallable<{ member: MemberProfile }, { ok: boolean }>(
    functions,
    'upsertMember',
  );
  await withTimeout(callable({ member }), FIREBASE_WRITE_TIMEOUT_MS, '部員情報の保存');
};

export const deleteMember = async (memberId: string): Promise<void> => {
  const { functions } = ensureFirebase();
  const callable = httpsCallable<{ memberId: string }, { ok: boolean }>(
    functions,
    'deleteMember',
  );
  await withTimeout(callable({ memberId }), FIREBASE_WRITE_TIMEOUT_MS, '部員情報の削除');
};

export const updateSiteSettings = async (settings: SiteSettings): Promise<void> => {
  const { functions } = ensureFirebase();
  const callable = httpsCallable<{ settings: SiteSettings }, { ok: boolean }>(
    functions,
    'updateSiteSettings',
  );
  await withTimeout(callable({ settings }), FIREBASE_WRITE_TIMEOUT_MS, 'サイト設定の保存');
};
