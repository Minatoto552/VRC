import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';

import type { PhotoStripItem } from '../lib/photo-strip';
import { fallbackPhotoStripItems, loadPhotoStripItems } from '../lib/photo-strip';

interface PhotoMarqueeProps {
  items: PhotoStripItem[];
}

export const PhotoMarquee = ({ items }: PhotoMarqueeProps) => {
  const [resolvedItems, setResolvedItems] = useState<PhotoStripItem[]>(
    items.length > 0 ? items : fallbackPhotoStripItems,
  );

  useEffect(() => {
    setResolvedItems(items.length > 0 ? items : fallbackPhotoStripItems);

    let cancelled = false;

    void loadPhotoStripItems().then((nextItems) => {
      if (!cancelled) {
        setResolvedItems(nextItems);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [items]);

  const loopItems = resolvedItems.length > 0 ? [...resolvedItems, ...resolvedItems] : [];

  return (
    <section className="photo-marquee-shell" aria-label="イベント写真ギャラリー">
      <div className="photo-marquee-heading">
        <div>
          <span className="eyebrow">Cafe Moments</span>
          <h2>イベント写真ギャラリー</h2>
        </div>
        <p>あとから登録した写真が、上部でゆっくり流れます。</p>
      </div>

      <div className="photo-marquee-window">
        <div className="photo-marquee-track">
          {loopItems.map((item, index) => (
            <article
              key={`${item.caption}-${index}`}
              className={`photo-marquee-card photo-tone-${item.tone} ${item.src ? 'has-image' : 'is-placeholder'}`}
              aria-hidden={index >= resolvedItems.length}
            >
              {item.src ? (
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
          ))}
        </div>
      </div>
    </section>
  );
};
