'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Touch screens: swipe left to open the next item, swipe right for the previous one.
 * Only clearly horizontal swipes count, so vertical scrolling is not affected.
 */
export default function SwipeSection({
  prevHref,
  nextHref,
  className,
  children,
}: {
  prevHref?: string;
  nextHref?: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (prevHref) router.prefetch(prevHref);
    if (nextHref) router.prefetch(nextHref);
  }, [router, prevHref, nextHref]);

  return (
    <section
      className={className}
      onTouchStart={(e) => {
        const t = e.touches[0];
        start.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const s = start.current;
        start.current = null;
        if (!s) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - s.x;
        const dy = t.clientY - s.y;
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        const href = dx < 0 ? nextHref : prevHref;
        if (href) router.push(href);
      }}
    >
      {children}
    </section>
  );
}
