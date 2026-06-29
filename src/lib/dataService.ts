import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, firebaseReady, functions } from './firebase';
import { defaultSettings, sampleActivities, sampleMembers } from './siteData';
import type { Activity, LotteryDraw, LotteryEntry, Member, ReceptionStatus, SiteSettings } from './types';

export async function getPublicActivities() {
  if (!db) {
    return sampleActivities;
  }

  const snapshot = await getDocs(
    query(collection(db, 'activities'), where('published', '==', true), orderBy('date', 'asc')),
  );

  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }) as Activity);
}

export async function getPublicMembers() {
  if (!db) {
    return sampleMembers;
  }

  const snapshot = await getDocs(
    query(collection(db, 'members'), where('published', '==', true), orderBy('sortOrder', 'asc')),
  );

  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }) as Member);
}

export function listenSettings(callback: (settings: SiteSettings) => void) {
  if (!db) {
    callback(defaultSettings);
    return () => undefined;
  }

  return onSnapshot(doc(db, 'siteSettings', 'public'), (snapshot) => {
    callback(snapshot.exists() ? ({ ...defaultSettings, ...snapshot.data() } as SiteSettings) : defaultSettings);
  });
}

export async function submitLotteryEntry(displayName: string) {
  if (!functions) {
    throw new Error(firebaseReady ? '通信に失敗しました。もう一度お試しください' : 'Firebase設定が未登録です。');
  }

  return httpsCallable(functions, 'submitLotteryEntry')({ displayName });
}

export async function adminLogin(password: string) {
  if (!functions) {
    throw new Error('Firebase設定が未登録です。');
  }

  return httpsCallable(functions, 'adminLogin')({ password });
}

export async function runLottery(winnerCount: number) {
  if (!functions) {
    throw new Error('Firebase設定が未登録です。');
  }

  return httpsCallable(functions, 'runLottery')({ winnerCount });
}

export async function resetLotteryEntries() {
  if (!functions) {
    throw new Error('Firebase設定が未登録です。');
  }

  return httpsCallable(functions, 'resetLotteryEntries')({});
}

export async function getAdminEntries() {
  if (!db) {
    return [] as LotteryEntry[];
  }

  const snapshot = await getDocs(query(collection(db, 'lotteryEntries'), orderBy('createdAt', 'asc')));
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }) as LotteryEntry);
}

export async function getDraws() {
  if (!db) {
    return [] as LotteryDraw[];
  }

  const snapshot = await getDocs(query(collection(db, 'lotteryDraws'), orderBy('drawnAt', 'desc'), limit(20)));
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }) as LotteryDraw);
}

export async function saveActivity(activity: Activity) {
  if (!db) {
    throw new Error('Firebase設定が未登録です。');
  }

  await setDoc(doc(db, 'activities', activity.id || crypto.randomUUID()), activity, { merge: true });
}

export async function saveMember(member: Member) {
  if (!db) {
    throw new Error('Firebase設定が未登録です。');
  }

  await setDoc(doc(db, 'members', member.id || crypto.randomUUID()), member, { merge: true });
}

export async function saveSettings(settings: SiteSettings) {
  if (!db) {
    throw new Error('Firebase設定が未登録です。');
  }

  await setDoc(doc(db, 'siteSettings', 'public'), settings, { merge: true });
}

export async function updateReceptionStatus(status: ReceptionStatus) {
  await saveSettings({ ...defaultSettings, lotteryStatus: status });
}

export async function deleteEntry(id: string) {
  if (!db) {
    throw new Error('Firebase設定が未登録です。');
  }

  await deleteDoc(doc(db, 'lotteryEntries', id));
}

export async function toggleEntry(id: string, eligible: boolean) {
  if (!db) {
    throw new Error('Firebase設定が未登録です。');
  }

  await updateDoc(doc(db, 'lotteryEntries', id), { eligible });
}
