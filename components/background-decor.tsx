'use client';

import { useEffect, useRef } from 'react';

/**
 * Three blurred blobs behind the page. Pure decoration: the cursor parallax
 * is a progressive enhancement, skipped for touch pointers and for anyone who
 * asked their system for less motion.
 */
export function BackgroundDecor() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || calm) return;

    const blobs = Array.from(root.current?.querySelectorAll<HTMLElement>('.bg-blob') ?? []);
    let frame = 0;

    const onMove = (event: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = event.clientX / window.innerWidth - 0.5;
        const y = event.clientY / window.innerHeight - 0.5;
        blobs.forEach((blob, index) => {
          const strength = 18 + index * 10;
          blob.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
        });
      });
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="bg-decor" ref={root} aria-hidden="true">
      <div className="bg-blob bg-blob-a" />
      <div className="bg-blob bg-blob-b" />
      <div className="bg-blob bg-blob-c" />
    </div>
  );
}
