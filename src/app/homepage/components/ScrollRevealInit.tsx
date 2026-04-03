'use client';
import { useEffect } from 'react';

export default function ScrollRevealInit() {
  useEffect(() => {
    const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    revealEls?.forEach((el) => observer?.observe(el));

    // Trigger visible on load
    revealEls?.forEach((el) => {
      if (el?.getBoundingClientRect()?.top < window.innerHeight) {
        el?.classList?.add('active');
      }
    });

    return () => observer?.disconnect();
  }, []);

  return null;
}