import { ArrowLeft } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ManagedPhotoFrame } from '../components/ManagedPhotoFrame';
import {
  getPhotoCategory,
  loadManagedPhotos,
  PHOTO_LIBRARY_UPDATED_EVENT,
  photoCategories,
  type ManagedPhotoAsset,
  type PhotoCategoryId,
} from '../lib/photo-library';

const isPhotoCategoryId = (value: string | undefined): value is PhotoCategoryId =>
  photoCategories.some((category) => category.id === value);

export const PhotoCategoryPage = () => {
  const { categoryId } = useParams();
  const [photos, setPhotos] = useState<ManagedPhotoAsset[]>(() => loadManagedPhotos());
  const validCategoryId = isPhotoCategoryId(categoryId) ? categoryId : null;
  const category = validCategoryId ? getPhotoCategory(validCategoryId) : null;
  const categoryPhotos = useMemo(
    () => (validCategoryId ? photos.filter((photo) => photo.category === validCategoryId) : []),
    [photos, validCategoryId],
  );

  useEffect(() => {
    const refresh = () => setPhotos(loadManagedPhotos());
    window.addEventListener(PHOTO_LIBRARY_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener(PHOTO_LIBRARY_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  if (!validCategoryId || !category) {
    return (
      <div className="page-stack">
        <section className="section-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Photo Archive</span>
              <h1>写真カテゴリが見つかりません</h1>
              <p>一覧ページへ戻って、登録済みのカテゴリを選び直してください。</p>
            </div>
          </div>
          <Link to="/photos" className="inline-link">
            <ArrowLeft size={16} />
            写真一覧へ戻る
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="section-card gallery-page-intro">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Category View</span>
            <h1>{category.title}</h1>
            <p>{category.description}</p>
          </div>
          <Link to="/photos" className="inline-link">
            <ArrowLeft size={16} />
            写真一覧へ戻る
          </Link>
        </div>
      </section>

      <section className="section-card">
        {categoryPhotos.length === 0 ? (
          <div className="gallery-empty-state">
            <strong>まだ写真がありません</strong>
            <p>運営ページの写真管理からこのカテゴリに画像を追加すると、ここへ一覧表示されます。</p>
          </div>
        ) : category.layout === 'portrait' ? (
          <div className="photo-archive-grid is-portrait">
            {categoryPhotos.map((photo) => (
              <article key={photo.id} className="photo-archive-card is-portrait">
                <ManagedPhotoFrame photo={photo} className="photo-archive-frame is-portrait" />
                <div className="photo-copy">
                  <strong>{photo.title}</strong>
                  <p>{photo.description || 'ポスター作品アーカイブ'}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="photo-archive-grid">
            {categoryPhotos.map((photo) => (
              <article key={photo.id} className="photo-archive-card">
                <ManagedPhotoFrame photo={photo} className="photo-archive-frame" />
                <div className="photo-copy">
                  <strong>{photo.title}</strong>
                  <p>{photo.description || 'ギャラリー写真'}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
