import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import type { PublicContent } from '../shared/models';
import { GsapPageMotion } from './components/GsapPageMotion';
import { SiteLayout } from './components/SiteLayout';
import { loadPublicContent, PUBLIC_CONTENT_UPDATED_EVENT } from './lib/api';
import { samplePublicContent } from './lib/sample-data';
import { AdminPage } from './pages/AdminPage';
import { ConceptPage } from './pages/ConceptPage';
import { FaqPage } from './pages/FaqPage';
import { HomePage } from './pages/HomePage';
import { JoinPage } from './pages/JoinPage';
import { MembersPage } from './pages/MembersPage';
import { SchedulePage } from './pages/SchedulePage';

const App = () => {
  const [content, setContent] = useState<PublicContent>(samplePublicContent);
  const [loading, setLoading] = useState(true);
  const [runtimeNotice, setRuntimeNotice] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const refreshPublicContent = () => {
      const loadingFallbackId = window.setTimeout(() => {
        if (mounted) {
          setLoading(false);
        }
      }, 900);

      void loadPublicContent()
        .then((nextContent) => {
          if (!mounted) {
            return;
          }

          setContent(nextContent);
          setRuntimeNotice(null);
        })
        .catch(() => {
          if (!mounted) {
            return;
          }

          setContent(samplePublicContent);
          setRuntimeNotice(null);
        })
        .finally(() => {
          window.clearTimeout(loadingFallbackId);

          if (mounted) {
            setLoading(false);
          }
        });
    };

    setLoading(true);
    refreshPublicContent();

    window.addEventListener(PUBLIC_CONTENT_UPDATED_EVENT, refreshPublicContent);

    return () => {
      mounted = false;
      window.removeEventListener(PUBLIC_CONTENT_UPDATED_EVENT, refreshPublicContent);
    };
  }, [location.pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionTargets = Array.from(
      new Set(
        Array.from(
          document.querySelectorAll<HTMLElement>(
            [
              'main .page-stack > *',
              'main .two-column-grid > *',
              'main .calendar-layout > *',
              'main .member-grid > *',
              'main .faq-list > *',
              'main .detail-card',
              'main .section-heading',
              'main .info-card',
              'main .member-card',
              'main .callout-card',
              'main .notice-box',
              'main .confirmation-card',
              'main .result-card',
              'main .accordion-item',
            ].join(', '),
          ),
        ),
      ),
    );

    motionTargets.forEach((element) => {
      element.classList.add('reveal-on-scroll');
    });

    if (prefersReducedMotion.matches) {
      motionTargets.forEach((element) => {
        element.classList.add('is-visible');
      });
      root.style.setProperty('--page-scroll', '0');

      return () => {
        root.style.removeProperty('--page-scroll');
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      {
        threshold: 0.16,
        rootMargin: '0px 0px -8% 0px',
      },
    );

    motionTargets.forEach((element) => {
      observer.observe(element);
    });

    let frameId = 0;

    const syncScroll = () => {
      frameId = 0;
      root.style.setProperty('--page-scroll', `${Math.min(window.scrollY, 1400)}`);
    };

    const handleScroll = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(syncScroll);
    };

    syncScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);

      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [location.pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const supportsFinePointer = window.matchMedia('(pointer: fine)');

    const resetPointer = () => {
      root.style.setProperty('--pointer-x', '0');
      root.style.setProperty('--pointer-y', '0');
    };

    if (prefersReducedMotion.matches || !supportsFinePointer.matches) {
      resetPointer();
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = (event.clientY / window.innerHeight) * 2 - 1;
      root.style.setProperty('--pointer-x', normalizedX.toFixed(4));
      root.style.setProperty('--pointer-y', normalizedY.toFixed(4));
    };

    const handlePointerLeave = () => {
      resetPointer();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      resetPointer();
    };
  }, []);

  return (
    <SiteLayout content={content} loading={loading} runtimeNotice={runtimeNotice}>
      <GsapPageMotion />
      <Routes>
        <Route path="/" element={<HomePage content={content} />} />
        <Route path="/concept" element={<ConceptPage content={content} />} />
        <Route path="/schedule" element={<SchedulePage activities={content.activities} />} />
        <Route path="/members" element={<MembersPage members={content.members} />} />
        <Route path="/join" element={<JoinPage guideNote={content.settings.joinGuideNote} />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </SiteLayout>
  );
};

export default App;
