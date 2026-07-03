import type {
  Activity,
  AdminContent,
  MemberProfile,
  PublicContent,
  SiteSettings,
} from '../../shared/models';
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

export const loadPublicContent = (): Promise<PublicContent> =>
  Promise.resolve(loadLocalPublicContent());

export const loadAdminContent = (): Promise<AdminContent> =>
  Promise.resolve(loadLocalAdminContent());

export const loginAsAdmin = (password: string): Promise<void> => {
  loginWithLocalPassword(password);
  return Promise.resolve();
};

export const logoutAdmin = (): Promise<void> => {
  logoutLocalAdmin();
  return Promise.resolve();
};

export const upsertActivity = (activity: Activity): Promise<void> => {
  upsertLocalActivity(activity);
  return Promise.resolve();
};

export const deleteActivity = (activityId: string): Promise<void> => {
  deleteLocalActivity(activityId);
  return Promise.resolve();
};

export const upsertMember = (member: MemberProfile): Promise<void> => {
  upsertLocalMember(member);
  return Promise.resolve();
};

export const deleteMember = (memberId: string): Promise<void> => {
  deleteLocalMember(memberId);
  return Promise.resolve();
};

export const updateSiteSettings = (settings: SiteSettings): Promise<void> => {
  updateLocalSiteSettings(settings);
  return Promise.resolve();
};
