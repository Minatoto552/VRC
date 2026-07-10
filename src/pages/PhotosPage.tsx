import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { ManagedPhotoFrame } from '../components/ManagedPhotoFrame';
import {
  loadManagedPhotos,
  PHOTO_LIBRARY_UPDATED_EVENT,
  photoCategories,
  type ManagedPhotoAsset,
} from '../lib/photo-library';

const EmptyPreview = ({ title, description }: { title: string; description: string }) => (
  <div className="gallery-empty-state">
    <strong>{title}</strong>
    <p>{description}</p>
  </div>
);

export const PhotosPage = () => {
  const [photos, setPhotos] = useState<ManagedPhotoAsset[]>(() => loadManagedPhotos());

  useEffect(() => {
    const refresh = () => setPhotos(loadManagedPhotos());
    window.addEventListener(PHOTO_LIBRARY_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener(PHOTO_LIBRARY_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const grouped = useMemo(
    () =>
      Object.fromEntries(
        photoCategories.map((category) => [
          category.id,
          photos.filter((photo) => photo.category === category.id).slice(0, category.previewLimit),
        ]),
      ) as Record<(typeof photoCategories)[number]['id'], ManagedPhotoAsset[]>,
    [photos],
  );

  return (
    <div className="page-stack">
      <section className="section-card gallery-page-intro">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Photo Archive</span>
            <h1>写真アーカイブ</h1>
            <p>
              イベント当日の空気感、キャストの日常、これまでのポスター作品をカテゴリごとにまとめて見られるページです。
            </p>
          </div>
        </div>
      </section>

      {photoCategories.map((category) => {
        const categoryPhotos = grouped[category.id];

        return (
          <section key={category.id} className={`section-card photo-section-card tone-${category.accent}`}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">Photo Category</span>
                <h2>{category.title}</h2>
                <p>{category.description}</p>
              </div>
              <Link to={category.route} className="inline-link">
                もっと見る <ArrowRight size={16} />
              </Link>
            </div>

            {categoryPhotos.length === 0 ? (
              <EmptyPreview
                title="まだ写真が登録されていません"
                description="運営ページの写真管理タブから画像を追加すると、ここへすぐ反映されます。"
              />
            ) : category.layout === 'portrait' ? (
              <div className="photo-poster-grid">
                {categoryPhotos.map((photo) => (
                  <article key={photo.id} className="photo-poster-card">
                    <ManagedPhotoFrame photo={photo} className="photo-poster-frame" />
                    <div className="photo-copy">
                      <strong>{photo.title}</strong>
                      <p>{photo.description || 'ポスター作品アーカイブ'}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="photo-preview-rail" role="list">
                {categoryPhotos.map((photo) => (
                  <article key={photo.id} className="photo-preview-card" role="listitem">
                    <ManagedPhotoFrame photo={photo} className="photo-preview-frame" />
                    <div className="photo-copy">
                      <strong>{photo.title}</strong>
                      <p>{photo.description || 'ギャラリー写真'}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};
