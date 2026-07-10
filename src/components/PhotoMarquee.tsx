import { Camera } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ManagedPhotoFrame } from './ManagedPhotoFrame';
import {
  loadManagedPhotosByCategory,
  PHOTO_LIBRARY_UPDATED_EVENT,
  type ManagedPhotoAsset,
} from '../lib/photo-library';
import type { PhotoStripItem } from '../lib/photo-strip';
import { fallbackPhotoStripItems, loadPhotoStripItems } from '../lib/photo-strip';

interface PhotoMarqueeProps {
  items: PhotoStripItem[];
}

const toneCycle: PhotoStripItem['tone'][] = ['counter', 'window', 'menu', 'lounge'];

const mapManagedPhotosToStrip = (photos: ManagedPhotoAsset[]): PhotoStripItem[] =>
  photos.map((photo, index) => ({
    alt: photo.title || 'イベント写真',
    caption: photo.title || `Photo ${index + 1}`,
    note: photo.description || '運営画面から登録されたイベント写真です。',
    src: photo.src,
    tone: toneCycle[index % toneCycle.length] ?? 'counter',
  }));

export const PhotoMarquee = ({ items }: PhotoMarqueeProps) => {
  const [managedPhotos, setManagedPhotos] = useState<ManagedPhotoAsset[] | null>(null);
  const [resolvedItems, setResolvedItems] = useState<PhotoStripItem[]>(
    items.length > 0 ? items : fallbackPhotoStripItems,
  );

  useEffect(() => {
    let cancelled = false;

    const resolveItems = async () => {
      const nextManagedPhotos = loadManagedPhotosByCategory('cast-event');

      if (nextManagedPhotos.length > 0) {
        if (!cancelled) {
          setManagedPhotos(nextManagedPhotos);
          setResolvedItems(mapManagedPhotosToStrip(nextManagedPhotos));
        }
        return;
      }

      const manifestItems = await loadPhotoStripItems();
      if (!cancelled) {
        setManagedPhotos(null);
        setResolvedItems(
          manifestItems.length > 0 ? manifestItems : items.length > 0 ? items : fallbackPhotoStripItems,
        );
      }
    };

    void resolveItems();

    const refreshManaged = () => {
      void resolveItems();
    };

    window.addEventListener(PHOTO_LIBRARY_UPDATED_EVENT, refreshManaged);
    window.addEventListener('storage', refreshManaged);

    return () => {
      cancelled = true;
      window.removeEventListener(PHOTO_LIBRARY_UPDATED_EVENT, refreshManaged);
      window.removeEventListener('storage', refreshManaged);
    };
  }, [items]);

  const loopItems = resolvedItems.length > 0 ? [...resolvedItems, ...resolvedItems] : [];
  const loopManagedPhotos =
    managedPhotos && managedPhotos.length > 0 ? [...managedPhotos, ...managedPhotos] : null;

  return (
    <section className="photo-marquee-shell" aria-label="イベント写真のスライド">
      <div className="photo-marquee-window">
        <div className="photo-marquee-track">
          {loopItems.map((item, index) => {
            const managedPhoto = loopManagedPhotos?.[index] ?? null;

            return (
              <article
                key={`${item.caption}-${index}`}
                className={`photo-marquee-card photo-tone-${item.tone} ${
                  item.src ? 'has-image' : 'is-placeholder'
                }`}
                aria-hidden={index >= resolvedItems.length}
              >
                {item.src && managedPhoto ? (
                  <ManagedPhotoFrame
                    photo={managedPhoto}
                    alt={item.alt}
                    className="photo-marquee-image-frame"
                  />
                ) : item.src ? (
                  <img src={item.src} alt={item.alt} loading="lazy" decoding="async" />
                ) : (
                  <div className="photo-marquee-placeholder" aria-label={item.alt}>
                    <div className="photo-marquee-placeholder-icon">
                      <Camera size={18} />
                      <span>Gallery</span>
                    </div>
                    <strong>{item.caption}</strong>
                    <span>{item.note}</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
