'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import NextImage from 'next/image';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import type { PropertyPhoto } from '../types/firestore';
import { IK, ikUrl } from '../utils/imagekit';

interface PropertyGalleryProps {
  photos: PropertyPhoto[];
  title: string;
  /** Content overlaid at the bottom-left of the slideshow (location, title, price). */
  children?: ReactNode;
}

/**
 * Full-width, hero-style slideshow: cross-fading photos with a slow zoom, auto-advance,
 * arrows, vertical dots, a progress bar and a full-screen viewer (click, arrow keys, swipe).
 */
export default function PropertyGallery({ photos, title, children }: PropertyGalleryProps) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = photos.length;

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + count) % count),
    [count]
  );

  // Auto-advance every 6 seconds (paused while the full-screen viewer is open).
  useEffect(() => {
    if (count < 2 || open) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(timer);
  }, [count, open, index]);

  // Keyboard controls and scroll lock while the full-screen viewer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, go]);

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1); // swipe left = next
  };

  return (
    <section
      aria-label={`${title} photos`}
      className="relative w-full h-[75vh] md:h-[88vh] overflow-hidden bg-[#1D1D1F]"
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      {count === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
          No photos yet
        </div>
      ) : (
        photos.map((photo, i) => (
          <div
            key={photo.url}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
              i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div
              className={`absolute inset-0 transition-transform duration-[7000ms] ease-out ${
                i === index ? 'scale-105' : 'scale-100'
              }`}
            >
              <NextImage
                src={ikUrl(photo.url, IK.hero)}
                alt={`${title}, photo ${i + 1} of ${count}`}
                fill
                priority={i === 0}
                unoptimized
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </div>
        ))
      )}

      {/* Click anywhere on the photo to open the full-screen viewer */}
      {count > 0 && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open full-screen gallery"
          className="absolute inset-0 z-[1] cursor-zoom-in"
        />
      )}

      {/* Gradient for legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />

      {/* Overlaid property info */}
      {children && (
        <div className="pointer-events-none relative z-10 max-w-7xl mx-auto h-full px-6 flex flex-col justify-end pb-16 md:pb-20 text-white">
          {children}
        </div>
      )}

      {/* Controls */}
      {count > 1 && (
        <>
          <div className="absolute top-1/2 -translate-y-1/2 right-6 z-20 flex flex-col items-center gap-3">
            {photos.slice(0, 12).map((photo, i) => (
              <button
                key={photo.url}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to photo ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === index ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          <div className="absolute bottom-8 right-6 z-20 hidden md:flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-white text-xs tracking-widest font-mono mr-1">
              <Expand className="w-3.5 h-3.5" /> {index + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
            <div
              className="h-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${((index + 1) / count) * 100}%` }}
            />
          </div>
        </>
      )}

      {/* Full-screen viewer */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photo gallery`}
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
          onTouchStart={(e) => {
            e.stopPropagation();
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            onTouchEnd(e);
          }}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close gallery"
            className="absolute top-5 right-5 z-10 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="absolute top-6 left-6 text-xs tracking-widest text-white/70 font-mono">
            {index + 1} / {count}
          </p>
          <div className="relative w-full h-full max-w-6xl max-h-[85vh] mx-auto">
            <NextImage
              key={index}
              src={ikUrl(photos[index].url, IK.lightbox)}
              alt={`${title}, photo ${index + 1} of ${count}`}
              fill
              unoptimized
              sizes="100vw"
              className="object-contain"
            />
          </div>
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous photo"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next photo"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
