import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

export const GsapPageMotion = () => {
  const location = useLocation();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return undefined;
    }

    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.gsap-reveal').forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 42, scale: 0.985 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 86%',
              once: true,
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>('.gsap-stagger').forEach((group) => {
        const cards = group.querySelectorAll<HTMLElement>('.gsap-card');

        gsap.fromTo(
          cards,
          { autoAlpha: 0, y: 34 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.72,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: {
              trigger: group,
              start: 'top 82%',
              once: true,
            },
          },
        );
      });

      gsap.to('.home-hero-art-panel', {
        yPercent: -4,
        ease: 'none',
        scrollTrigger: {
          trigger: '.home-hero-editorial',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.7,
        },
      });

      gsap.to('.photo-marquee-shell', {
        y: -18,
        ease: 'none',
        scrollTrigger: {
          trigger: '.photo-marquee-shell',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.8,
        },
      });
    });

    ScrollTrigger.refresh();

    return () => {
      context.revert();
    };
  }, [location.pathname]);

  return null;
};
