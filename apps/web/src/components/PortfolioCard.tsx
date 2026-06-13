"use client";

import { useState, useRef } from "react";
import type { PortfolioItem } from "@/lib/api";
import { mediaSrc } from "@/lib/api";

export function PortfolioCard({ item }: { item: PortfolioItem }) {
  const [active, setActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const src = mediaSrc(item.mediaUrl);

  const handleEnter = () => {
    setActive(true);
    if (item.mediaType === "video" && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleLeave = () => {
    setActive(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <article
      className="portfolio-card group relative overflow-hidden bg-ink-soft"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {item.mediaType === "video" ? (
          <video
            ref={videoRef}
            src={src}
            muted
            loop
            playsInline
            className="portfolio-media h-full w-full object-cover transition duration-700 ease-out"
            poster={item.thumbnailUrl ? mediaSrc(item.thumbnailUrl) : undefined}
          />
        ) : item.mediaType === "gif" ? (
          <img
            src={src}
            alt={item.title}
            className="portfolio-media h-full w-full object-cover transition duration-700 ease-out"
          />
        ) : (
          <img
            src={src}
            alt={item.title}
            className="portfolio-media h-full w-full object-cover transition duration-700 ease-out"
          />
        )}
        <div className="portfolio-overlay absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink via-ink/40 to-transparent p-6 opacity-0 transition duration-500">
          <span className="mb-2 text-xs uppercase tracking-[0.2em] text-gold">
            {item.category}
          </span>
          <h3 className="font-[family-name:var(--font-display)] text-2xl text-cream">
            {item.title}
          </h3>
          {item.description && (
            <p className="mt-2 line-clamp-2 text-sm text-cream-muted">
              {item.description}
            </p>
          )}
        </div>
        {item.mediaType === "video" && !active && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cream/30 bg-ink/50 backdrop-blur-sm">
              <svg className="ml-1 h-5 w-5 text-cream" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
