export type PhotoCategoryId = 'cast-event' | 'cast-daily' | 'poster-archive';

export interface ManagedPhotoAsset {
  id: string;
  category: PhotoCategoryId;
  title: string;
  description: string;
  src: string;
  focalX: number;
  focalY: number;
  zoom: number;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoCategoryDefinition {
  id: PhotoCategoryId;
  title: string;
  shortTitle: string;
  description: string;
  accent: string;
  layout: 'landscape' | 'portrait';
  route: string;
  previewLimit: number;
}

export const photoCategories: PhotoCategoryDefinition[] = [
  {
    id: 'cast-event',
    title: 'キャストのイベント写真',
    shortTitle: 'イベント写真',
    description: '本番当日の空気感や、キャストの立ち回りが伝わる横長スライドです。',
    accent: 'sage',
    layout: 'landscape',
    route: '/photos/cast-event',
    previewLimit: 8,
  },
  {
    id: 'cast-daily',
    title: 'キャストの日常スライド',
    shortTitle: '日常スライド',
    description: '準備中の一幕や普段の交流を、やわらかい横長カットで見せるギャラリーです。',
    accent: 'amber',
    layout: 'landscape',
    route: '/photos/cast-daily',
    previewLimit: 8,
  },
  {
    id: 'poster-archive',
    title: 'これまでのポスター作品',
    shortTitle: 'ポスター作品',
    description: '過去に制作したポスターを縦長レイアウトで一覧できるアーカイブです。',
    accent: 'rose',
    layout: 'portrait',
    route: '/photos/poster-archive',
    previewLimit: 6,
  },
] as const;

export const PHOTO_LIBRARY_UPDATED_EVENT = 'shikitsukika-photo-library-updated';

const STORAGE_KEY = 'shikitsukika-photo-library-v1';

const canUseStorage = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const emitPhotoLibraryUpdated = (): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PHOTO_LIBRARY_UPDATED_EVENT));
  }
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const nowIso = (): string => new Date().toISOString();

const sortPhotos = (photos: ManagedPhotoAsset[]): ManagedPhotoAsset[] =>
  photos
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || right.createdAt.localeCompare(left.createdAt));

const sanitizePhoto = (candidate: ManagedPhotoAsset): ManagedPhotoAsset => ({
  ...candidate,
  title: candidate.title.trim() || '未設定の写真',
  description: candidate.description.trim(),
  focalX: clamp(candidate.focalX, 0, 100),
  focalY: clamp(candidate.focalY, 0, 100),
  zoom: clamp(candidate.zoom, 1, 2.6),
});

export const loadManagedPhotos = (): ManagedPhotoAsset[] => {
  if (!canUseStorage()) {
    return [];
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const photos = parsed
      .map((item): ManagedPhotoAsset | null => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const candidate = item as Partial<ManagedPhotoAsset>;
        if (
          typeof candidate.id !== 'string' ||
          typeof candidate.category !== 'string' ||
          typeof candidate.title !== 'string' ||
          typeof candidate.description !== 'string' ||
          typeof candidate.src !== 'string' ||
          typeof candidate.focalX !== 'number' ||
          typeof candidate.focalY !== 'number' ||
          typeof candidate.zoom !== 'number' ||
          typeof candidate.createdAt !== 'string' ||
          typeof candidate.updatedAt !== 'string'
        ) {
          return null;
        }

        return sanitizePhoto(candidate as ManagedPhotoAsset);
      })
      .filter((item): item is ManagedPhotoAsset => item !== null);

    return sortPhotos(photos);
  } catch {
    return [];
  }
};

const writeManagedPhotos = (photos: ManagedPhotoAsset[]): void => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortPhotos(photos)));
  emitPhotoLibraryUpdated();
};

export const loadManagedPhotosByCategory = (category: PhotoCategoryId): ManagedPhotoAsset[] =>
  loadManagedPhotos().filter((photo) => photo.category === category);

export const upsertManagedPhoto = (photo: ManagedPhotoAsset): ManagedPhotoAsset[] => {
  const nextPhoto = sanitizePhoto({
    ...photo,
    updatedAt: nowIso(),
  });

  const current = loadManagedPhotos();
  const exists = current.some((item) => item.id === nextPhoto.id);
  const next = exists
    ? current.map((item) => (item.id === nextPhoto.id ? nextPhoto : item))
    : [nextPhoto, ...current];

  writeManagedPhotos(next);
  return sortPhotos(next);
};

export const deleteManagedPhoto = (photoId: string): ManagedPhotoAsset[] => {
  const next = loadManagedPhotos().filter((photo) => photo.id !== photoId);
  writeManagedPhotos(next);
  return next;
};

const stripFileExtension = (filename: string): string => filename.replace(/\.[^.]+$/, '');

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('画像の読み込みに失敗しました。'));
    reader.readAsDataURL(file);
  });

export const importManagedPhotos = async (
  category: PhotoCategoryId,
  files: FileList | File[],
): Promise<ManagedPhotoAsset[]> => {
  const fileList = Array.from(files);
  const imported = await Promise.all(
    fileList.map(async (file) => {
      const src = await readFileAsDataUrl(file);
      const timestamp = nowIso();

      return {
        id: `photo-${crypto.randomUUID()}`,
        category,
        title: stripFileExtension(file.name) || '新しい写真',
        description: '',
        src,
        focalX: 50,
        focalY: 50,
        zoom: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      } satisfies ManagedPhotoAsset;
    }),
  );

  const next = [...imported, ...loadManagedPhotos()];
  writeManagedPhotos(next);
  return sortPhotos(imported);
};

export const getPhotoCategory = (categoryId: PhotoCategoryId): PhotoCategoryDefinition =>
  photoCategories.find((category) => category.id === categoryId) ?? photoCategories[0]!;
