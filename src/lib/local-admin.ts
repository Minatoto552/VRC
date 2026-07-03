import type {
  Activity,
  AdminAuditLog,
  AdminContent,
  MemberProfile,
  PublicContent,
  SiteSettings,
} from '../../shared/models';
import {
  activitySchema,
  memberSchema,
  siteSettingsSchema,
} from '../../shared/validation';
import { sampleActivities, sampleMembers, sampleSettings } from './sample-data';

export const LOCAL_ADMIN_PASSWORD = '1112';

const ADMIN_CONTENT_KEY = 'event-cafe-local-admin-content-v1';
const ADMIN_SESSION_KEY = 'event-cafe-local-admin-session-v1';
export const LOCAL_ADMIN_SESSION_EVENT = 'event-cafe-local-admin-session-change';

const canUseStorage = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

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

const buildInitialAdminContent = (): AdminContent => ({
  activities: clone(sampleActivities),
  members: clone(sampleMembers),
  settings: clone(sampleSettings),
  entries: [],
  draws: [],
  audits: [],
  mode: 'sample',
});

const writeStoredAdminContent = (content: AdminContent): void => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(ADMIN_CONTENT_KEY, JSON.stringify(content));
};

const addAuditLog = (
  content: AdminContent,
  action: string,
  message: string,
  outcome: AdminAuditLog['outcome'] = 'success',
): AdminContent => ({
  ...content,
  audits: [
    {
      id: `audit-${crypto.randomUUID()}`,
      action,
      outcome,
      targetType: 'local-admin',
      targetId: action,
      actorName: 'local-admin',
      actorUid: 'local-admin',
      message,
      createdAt: nowIso(),
    },
    ...content.audits,
  ].slice(0, 24),
});

export const loadLocalAdminContent = (): AdminContent => {
  if (!canUseStorage()) {
    return buildInitialAdminContent();
  }

  const stored = window.localStorage.getItem(ADMIN_CONTENT_KEY);
  if (!stored) {
    const initial = buildInitialAdminContent();
    writeStoredAdminContent(initial);
    return initial;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<AdminContent>;

    return {
      ...buildInitialAdminContent(),
      ...parsed,
      activities: Array.isArray(parsed.activities) ? parsed.activities : clone(sampleActivities),
      members: Array.isArray(parsed.members) ? parsed.members : clone(sampleMembers),
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      draws: Array.isArray(parsed.draws) ? parsed.draws : [],
      audits: Array.isArray(parsed.audits) ? parsed.audits : [],
      settings: {
        ...sampleSettings,
        ...(parsed.settings ?? {}),
      },
      mode: 'sample',
    };
  } catch {
    const fallback = buildInitialAdminContent();
    writeStoredAdminContent(fallback);
    return fallback;
  }
};

const saveLocalAdminContent = (updater: (current: AdminContent) => AdminContent): AdminContent => {
  const next = updater(loadLocalAdminContent());
  writeStoredAdminContent(next);
  return next;
};

export const loadLocalPublicContent = (): PublicContent => {
  const content = loadLocalAdminContent();

  return {
    activities: content.activities.filter((activity) => activity.isPublic),
    members: content.members.filter((member) => member.isPublic),
    settings: content.settings,
  };
};

const emitSessionChange = (): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LOCAL_ADMIN_SESSION_EVENT));
  }
};

export const isLocalAdminSignedIn = (): boolean =>
  canUseStorage() && window.localStorage.getItem(ADMIN_SESSION_KEY) === 'true';

export const loginWithLocalPassword = (password: string): void => {
  if (password !== LOCAL_ADMIN_PASSWORD) {
    throw new Error('パスワードが正しくありません。');
  }

  if (canUseStorage()) {
    window.localStorage.setItem(ADMIN_SESSION_KEY, 'true');
  }

  emitSessionChange();
};

export const logoutLocalAdmin = (): void => {
  if (canUseStorage()) {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
  }

  emitSessionChange();
};

export const upsertLocalActivity = (activity: Activity): void => {
  const parsed = activitySchema.safeParse(activity);
  if (!parsed.success) {
    throw new Error(getFirstIssueMessage(parsed, '活動予定を確認してください。'));
  }

  saveLocalAdminContent((current) => {
    const exists = current.activities.some((item) => item.id === parsed.data.id);
    const activities = exists
      ? current.activities.map((item) => (item.id === parsed.data.id ? parsed.data : item))
      : [parsed.data, ...current.activities];

    return addAuditLog(
      {
        ...current,
        activities,
      },
      'activity-saved',
      `活動予定「${parsed.data.title}」を保存しました。`,
    );
  });
};

export const deleteLocalActivity = (activityId: string): void => {
  saveLocalAdminContent((current) =>
    addAuditLog(
      {
        ...current,
        activities: current.activities.filter((activity) => activity.id !== activityId),
      },
      'activity-deleted',
      '活動予定を削除しました。',
    ),
  );
};

export const upsertLocalMember = (member: MemberProfile): void => {
  const parsed = memberSchema.safeParse(member);
  if (!parsed.success) {
    throw new Error(getFirstIssueMessage(parsed, '部員情報を確認してください。'));
  }

  saveLocalAdminContent((current) => {
    const exists = current.members.some((item) => item.id === parsed.data.id);
    const members = exists
      ? current.members.map((item) => (item.id === parsed.data.id ? parsed.data : item))
      : [parsed.data, ...current.members];

    return addAuditLog(
      {
        ...current,
        members,
      },
      'member-saved',
      `部員「${parsed.data.vrcName}」を保存しました。`,
    );
  });
};

export const deleteLocalMember = (memberId: string): void => {
  saveLocalAdminContent((current) =>
    addAuditLog(
      {
        ...current,
        members: current.members.filter((member) => member.id !== memberId),
      },
      'member-deleted',
      '部員情報を削除しました。',
    ),
  );
};

export const updateLocalSiteSettings = (settings: SiteSettings): void => {
  const parsed = siteSettingsSchema.safeParse(settings);
  if (!parsed.success) {
    throw new Error(getFirstIssueMessage(parsed, 'サイト設定を確認してください。'));
  }

  saveLocalAdminContent((current) =>
    addAuditLog(
      {
        ...current,
        settings: parsed.data,
      },
      'site-settings-saved',
      'サイト設定を保存しました。',
    ),
  );
};
