import { Camera } from 'lucide-react';

import type { PhotoStripItem } from '../lib/photo-strip';

interface PhotoMarqueeProps {
  items: PhotoStripItem[];
}

export const PhotoMarquee = ({ items }: PhotoMarqueeProps) => {
  const loopItems = items.length > 0 ? [...items, ...items] : [];

  return (
    <section className="section-card photo-marquee-shell" aria-label="イベント写真スライド">
      <div className="section-heading photo-marquee-heading">
        <div>
          <span className="eyebrow">Cafe Moments</span>
          <h2>イベント写真ギャラリー</h2>
        </div>
        <p>あとから登録した写真が、店内の記憶をめくるように上部でゆっくり流れます。</p>
      </div>

      <div className="photo-marquee-window">
        <div className="photo-marquee-track">
          {loopItems.map((item, index) => (
            <article
              key={`${item.caption}-${index}`}
              className={`photo-marquee-card photo-tone-${item.tone} ${item.src ? 'has-image' : 'is-placeholder'}`}
              aria-hidden={index >= items.length}
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
