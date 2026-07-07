import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import type {
  Activity,
  AdminAuditLog,
  AdminContent,
  LotteryDraw,
  LotteryEntry,
  MemberProfile,
  PublicContent,
  SiteSettings,
} from '../../shared/models';
import {
  activitySchema,
  memberSchema,
  siteSettingsSchema,
} from '../../shared/validation';
import { firebaseServices, runtimeMode } from './firebase';
import {
  deleteLocalActivity,
  deleteLocalMember,
  loadLocalAdminContent,
  loadLocalPublicContent,
  loginWithLocalPassword,
  logoutLocalAdmin,
  updateLocalSiteSettings,
  upsertLocalActivity,
  upsertLocalMember,
} from './local-admin';
import { sampleSettings } from './sample-data';

export const PUBLIC_CONTENT_UPDATED_EVENT = 'event-cafe-public-content-updated';

const canUseFirestore = (): boolean => Boolean(firebaseServices.firestore);

const emitPublicContentUpdated = (): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PUBLIC_CONTENT_UPDATED_EVENT));
  }
};

const toEntity = <T extends { id: string }>(snapshot: QueryDocumentSnapshot<DocumentData>): T =>
  ({
    id: snapshot.id,
    ...snapshot.data(),
  }) as T;

const nowIso = (): string => new Date().toISOString();

const getFirstIssueMessage = (
  result:
    | { success: true }
    | { success: false; error: { issues: Array<{ message: string }> } },
  fallback: string,
): string => {
  if (result.success) {
    return fallback;
  }

  return result.error.issues[0]?.message ?? fallback;
};

const loadFirestoreSettings = async (): Promise<SiteSettings> => {
  if (!firebaseServices.firestore) {
    return sampleSettings;
  }

  const snapshot = await getDoc(doc(firebaseServices.firestore, 'siteSettings', 'public'));

  return snapshot.exists() ? { ...sampleSettings, ...snapshot.data() } : sampleSettings;
};

const writeAuditLog = async (message: string, action: string, targetType: string, targetId: string): Promise<void> => {
  if (!firebaseServices.firestore) {
    return;
  }

  const auditId = `audit-${crypto.randomUUID()}`;
  const payload: Omit<AdminAuditLog, 'id'> = {
    action,
    outcome: 'success',
    targetType,
    targetId,
    actorName: 'local-password-admin',
    actorUid: 'local-password-admin',
    message,
    createdAt: nowIso(),
  };

  await setDoc(doc(firebaseServices.firestore, 'adminAuditLogs', auditId), payload);
};

export const loadPublicContent = async (): Promise<PublicContent> => {
  if (!canUseFirestore() || !firebaseServices.firestore) {
    return loadLocalPublicContent();
  }

  const [activitiesSnapshot, membersSnapshot, settings] = await Promise.all([
    getDocs(
      query(
        collection(firebaseServices.firestore, 'activities'),
        where('isPublic', '==', true),
        orderBy('date', 'asc'),
      ),
    ),
    getDocs(
      query(
        collection(firebaseServices.firestore, 'members'),
        where('isPublic', '==', true),
        orderBy('sortOrder', 'asc'),
      ),
    ),
    loadFirestoreSettings(),
  ]);

  return {
    activities: activitiesSnapshot.docs.map((snapshot) => toEntity<Activity>(snapshot)),
    members: membersSnapshot.docs.map((snapshot) => toEntity<MemberProfile>(snapshot)),
    settings,
  };
};

export const loadAdminContent = async (): Promise<AdminContent> => {
  if (!canUseFirestore() || !firebaseServices.firestore) {
    return loadLocalAdminContent();
  }

  const [
    activitiesSnapshot,
    membersSnapshot,
    entriesSnapshot,
    drawsSnapshot,
    auditsSnapshot,
    settings,
  ] = await Promise.all([
    getDocs(query(collection(firebaseServices.firestore, 'activities'), orderBy('date', 'asc'))),
    getDocs(query(collection(firebaseServices.firestore, 'members'), orderBy('sortOrder', 'asc'))),
    getDocs(query(collection(firebaseServices.firestore, 'lotteryEntries'), orderBy('createdAt', 'desc'))),
    getDocs(query(collection(firebaseServices.firestore, 'lotteryDraws'), orderBy('createdAt', 'desc'))),
    getDocs(query(collection(firebaseServices.firestore, 'adminAuditLogs'), orderBy('createdAt', 'desc'), limit(12))),
    loadFirestoreSettings(),
  ]);

  return {
    activities: activitiesSnapshot.docs.map((snapshot) => toEntity<Activity>(snapshot)),
    members: membersSnapshot.docs.map((snapshot) => toEntity<MemberProfile>(snapshot)),
    settings,
    entries: entriesSnapshot.docs.map((snapshot) => toEntity<LotteryEntry>(snapshot)),
    draws: drawsSnapshot.docs.map((snapshot) => toEntity<LotteryDraw>(snapshot)),
    audits: auditsSnapshot.docs.map((snapshot) => toEntity<AdminAuditLog>(snapshot)),
    mode: runtimeMode,
  };
};

export const loginAsAdmin = (password: string): Promise<void> => {
  loginWithLocalPassword(password);
  return Promise.resolve();
};

export const logoutAdmin = (): Promise<void> => {
  logoutLocalAdmin();
  return Promise.resolve();
};

export const upsertActivity = async (activity: Activity): Promise<void> => {
  if (!canUseFirestore() || !firebaseServices.firestore) {
    upsertLocalActivity(activity);
    emitPublicContentUpdated();
    return;
  }

  const parsed = activitySchema.safeParse(activity);
  if (!parsed.success) {
    throw new Error(getFirstIssueMessage(parsed, '活動予定を確認してください。'));
  }

  await setDoc(doc(firebaseServices.firestore, 'activities', parsed.data.id), parsed.data, { merge: true });
  await writeAuditLog(`活動予定「${parsed.data.title}」を保存しました。`, '活動予定変更', 'activities', parsed.data.id);
  emitPublicContentUpdated();
};

export const deleteActivity = async (activityId: string): Promise<void> => {
  if (!canUseFirestore() || !firebaseServices.firestore) {
    deleteLocalActivity(activityId);
    emitPublicContentUpdated();
    return;
  }

  await deleteDoc(doc(firebaseServices.firestore, 'activities', activityId));
  await writeAuditLog('活動予定を削除しました。', '活動予定変更', 'activities', activityId);
  emitPublicContentUpdated();
};

export const upsertMember = async (member: MemberProfile): Promise<void> => {
  if (!canUseFirestore() || !firebaseServices.firestore) {
    upsertLocalMember(member);
    emitPublicContentUpdated();
    return;
  }

  const parsed = memberSchema.safeParse(member);
  if (!parsed.success) {
    throw new Error(getFirstIssueMessage(parsed, '部員情報を確認してください。'));
  }

  await setDoc(doc(firebaseServices.firestore, 'members', parsed.data.id), parsed.data, { merge: true });
  await writeAuditLog(`部員「${parsed.data.vrcName}」を保存しました。`, '部員情報変更', 'members', parsed.data.id);
  emitPublicContentUpdated();
};

export const deleteMember = async (memberId: string): Promise<void> => {
  if (!canUseFirestore() || !firebaseServices.firestore) {
    deleteLocalMember(memberId);
    emitPublicContentUpdated();
    return;
  }

  await deleteDoc(doc(firebaseServices.firestore, 'members', memberId));
  await writeAuditLog('部員情報を削除しました。', '部員情報変更', 'members', memberId);
  emitPublicContentUpdated();
};

export const updateSiteSettings = async (settings: SiteSettings): Promise<void> => {
  if (!canUseFirestore() || !firebaseServices.firestore) {
    updateLocalSiteSettings(settings);
    emitPublicContentUpdated();
    return;
  }

  const parsed = siteSettingsSchema.safeParse(settings);
  if (!parsed.success) {
    throw new Error(getFirstIssueMessage(parsed, 'サイト設定を確認してください。'));
  }

  await setDoc(doc(firebaseServices.firestore, 'siteSettings', 'public'), parsed.data, { merge: true });
  await writeAuditLog('サイト設定を保存しました。', 'サイト設定変更', 'siteSettings', 'public');
  emitPublicContentUpdated();
};
