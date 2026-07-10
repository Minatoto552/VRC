import type { ReactNode } from 'react';

interface PageIntroProps {
  caption: string;
  children?: ReactNode;
  chips?: string[];
  description: string;
  eyebrow: string;
  imageAlt: string;
  imageSrc: string;
  reverse?: boolean;
  title: string;
}

export const PageIntro = ({
  caption,
  children,
  chips,
  description,
  eyebrow,
  imageAlt,
  imageSrc,
  reverse = false,
  title,
}: PageIntroProps) => (
  <section className={`section-card page-intro-card ${reverse ? 'page-intro-card-reverse' : ''}`}>
    <div className="page-intro-layout">
      <div className="page-intro-copy">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {chips && chips.length > 0 ? (
          <div className="page-intro-chip-row" aria-label={`${title}の補足情報`}>
            {chips.map((chip) => (
              <span key={chip} className="page-intro-chip">
                {chip}
              </span>
            ))}
          </div>
        ) : null}
        {children ? <div className="page-intro-note">{children}</div> : null}
      </div>

      <figure className="page-intro-figure">
        <div className="page-intro-frame">
          <img className="page-intro-image" src={imageSrc} alt={imageAlt} loading="lazy" decoding="async" />
        </div>
        <figcaption className="page-intro-caption">{caption}</figcaption>
      </figure>
    </div>
  </section>
);
