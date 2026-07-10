import type { SiteSettings } from '../../shared/models';

export const defaultSiteName = '四季月家';
export const defaultSiteSubtitle = '2026年3月同期会キャスト部';
export const defaultSiteDescription =
  '2026年3月同期会キャスト部がVRChat上で企画・運営する、やわらかな夜のカフェBarイベントの案内サイトです。';
export const defaultJoinGuideNote =
  '説明会の日程は活動予定ページで確認できます。面接は威圧的な選考ではなく、お互いに安心して活動できるかを確かめるための軽い確認です。';

const legacySiteNames = new Set([
  '2026年3月同期会 Event Cafe',
  '2026年3月同期会 Event Café',
  'Event Cafe 2026',
  'Event Café 2026',
  '四季月下',
]);

const normalizeText = (value: string | undefined, fallback: string): string => {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : fallback;
};

export const normalizeSiteSettings = (settings: SiteSettings): SiteSettings => {
  const normalizedName = normalizeText(settings.siteName, defaultSiteName);

  return {
    ...settings,
    siteName: legacySiteNames.has(normalizedName) ? defaultSiteName : normalizedName,
    siteDescription: normalizeText(settings.siteDescription, defaultSiteDescription),
    joinGuideNote: normalizeText(settings.joinGuideNote, defaultJoinGuideNote),
    supportEmail: normalizeText(settings.supportEmail, 'cast@example.com'),
  };
};
