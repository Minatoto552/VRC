export interface PhotoStripItem {
  alt: string;
  caption: string;
  note: string;
  tone: 'counter' | 'window' | 'menu' | 'lounge';
  src?: string;
}

const photoTones = ['counter', 'window', 'menu', 'lounge'] as const;

interface PhotoManifestItem {
  alt?: string;
  caption?: string;
  note?: string;
  src?: string;
  tone?: string;
}

const isPhotoTone = (value: string): value is PhotoStripItem['tone'] =>
  (photoTones as readonly string[]).includes(value);

const normalizeSource = (value: string): string =>
  value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')
    ? value
    : `/gallery/${value}`;

export const fallbackPhotoStripItems: PhotoStripItem[] = [
  {
    alt: 'カウンターまわりの写真プレースホルダー',
    caption: 'Event Scene',
    note: 'イベント当日の写真を登録すると、ここへ横長スライドで流れます。',
    tone: 'counter',
  },
  {
    alt: '日常スナップの写真プレースホルダー',
    caption: 'Daily Scene',
    note: '日常スライド用の写真を追加すると、やわらかな空気感で表示されます。',
    tone: 'window',
  },
  {
    alt: 'メニューや掲示物の写真プレースホルダー',
    caption: 'Menu Board',
    note: 'ポスターや告知作品を登録すると、写真ページからも一覧できます。',
    tone: 'menu',
  },
  {
    alt: 'ラウンジカットの写真プレースホルダー',
    caption: 'Lounge Cut',
    note: '運営ページの写真管理タブから、あとでまとめて差し替えられます。',
    tone: 'lounge',
  },
];

export const loadPhotoStripItems = async (): Promise<PhotoStripItem[]> => {
  try {
    const response = await fetch('/gallery/manifest.json', {
      cache: 'no-store',
    });

    if (!response.ok) {
      return fallbackPhotoStripItems;
    }

    const manifest = (await response.json()) as unknown;
    if (!Array.isArray(manifest)) {
      return fallbackPhotoStripItems;
    }

    const items = manifest
      .map((item): PhotoStripItem | null => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const candidate = item as PhotoManifestItem;
        if (
          typeof candidate.src !== 'string' ||
          typeof candidate.alt !== 'string' ||
          typeof candidate.caption !== 'string' ||
          typeof candidate.note !== 'string' ||
          typeof candidate.tone !== 'string' ||
          !isPhotoTone(candidate.tone)
        ) {
          return null;
        }

        return {
          alt: candidate.alt,
          caption: candidate.caption,
          note: candidate.note,
          src: normalizeSource(candidate.src),
          tone: candidate.tone,
        };
      })
      .filter((item): item is PhotoStripItem => item !== null);

    return items.length > 0 ? items : fallbackPhotoStripItems;
  } catch {
    return fallbackPhotoStripItems;
  }
};
