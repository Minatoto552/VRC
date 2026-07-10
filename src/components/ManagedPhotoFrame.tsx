import type { CSSProperties } from 'react';

import type { ManagedPhotoAsset } from '../lib/photo-library';

interface ManagedPhotoFrameProps {
  photo: ManagedPhotoAsset;
  alt?: string;
  className?: string;
}

export const ManagedPhotoFrame = ({ photo, alt, className }: ManagedPhotoFrameProps) => {
  const style = {
    '--photo-position-x': `${photo.focalX}%`,
    '--photo-position-y': `${photo.focalY}%`,
    '--photo-zoom': `${photo.zoom}`,
  } as CSSProperties;

  return (
    <div className={className ? `managed-photo-frame ${className}` : 'managed-photo-frame'} style={style}>
      <img src={photo.src} alt={alt ?? photo.title} loading="lazy" decoding="async" />
    </div>
  );
};
