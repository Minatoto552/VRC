export interface PhotoStripItem {
  alt: string;
  caption: string;
  note: string;
  tone: 'counter' | 'window' | 'menu' | 'lounge';
  src?: string;
}

export const photoStripItems: PhotoStripItem[] = [
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
    note: '後日 /public/gallery/ 配下へ写真を置くと自動で流せます',
    tone: 'lounge',
  },
];
