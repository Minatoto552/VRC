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
    alt: 'カウンター風の写真枠',
    caption: 'Counter Light',
    note: 'あとからイベント当日のカウンター写真を追加できます',
    tone: 'counter',
  },
  {
    alt: '窓際風の写真枠',
    caption: 'Window Mood',
    note: '横長の店内写真や夜景カットに向いています',
    tone: 'window',
  },
  {
    alt: 'メニューボード風の写真枠',
    caption: 'Menu Board',
    note: '告知画像やイベント風景の差し込みにおすすめです',
    tone: 'menu',
  },
  {
    alt: 'ラウンジ風の写真枠',
    caption: 'Lounge Cut',
    note: '後日 gallery マニフェストを追加すると、ここへ写真を流せます',
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
