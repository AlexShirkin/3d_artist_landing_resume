"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PortfolioItem } from "@/lib/api";
import { mediaSrc } from "@/lib/api";

export function PortfolioCard({ item }: { item: PortfolioItem }) {
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const [loadVideo, setLoadVideo] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readyHandlerRef = useRef<(() => void) | null>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const src = mediaSrc(item.mediaUrl);
  const posterSrc = item.thumbnailUrl ? mediaSrc(item.thumbnailUrl) : null;

  const showOverlay = expanded || revealed;
  const hasDescription = Boolean(item.description?.trim());
  const isVideo = item.mediaType === "video";
  const showPoster = isVideo && posterSrc && !playing;

  useEffect(() => {
    if (!isVideo) return;

    const node = articleRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setLoadVideo(true);
      },
      { rootMargin: "240px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVideo]);

  useEffect(() => {
    const el = descRef.current;
    if (!el || !hasDescription) {
      setCanExpand(false);
      return;
    }

    const check = () => {
      setCanExpand(el.scrollHeight > el.clientHeight + 1);
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [hasDescription, item.description]);

  useEffect(() => {
    if (!expanded) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  const clearReadyHandler = useCallback(() => {
    const video = videoRef.current;
    const handler = readyHandlerRef.current;
    if (video && handler) {
      video.removeEventListener("canplay", handler);
      readyHandlerRef.current = null;
    }
  }, []);

  const playVideo = useCallback(() => {
    if (!isVideo) return;
    setLoadVideo(true);

    const video = videoRef.current;
    if (!video) return;

    const start = () => {
      void video
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      start();
      return;
    }

    clearReadyHandler();
    const onReady = () => {
      readyHandlerRef.current = null;
      start();
    };
    readyHandlerRef.current = onReady;
    video.addEventListener("canplay", onReady);
  }, [clearReadyHandler, isVideo]);

  const stopVideo = useCallback(() => {
    clearReadyHandler();
    setPlaying(false);
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  }, [clearReadyHandler]);

  const handleEnter = () => {
    if (expanded) return;
    if (isVideo) playVideo();
  };

  const handleLeave = () => {
    if (expanded) return;
    setRevealed(false);
    if (isVideo) stopVideo();
  };

  const handleCardClick = () => {
    if (expanded) return;
    if (window.matchMedia("(hover: none)").matches) {
      setRevealed((value) => !value);
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playVideo();
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(true);
    setRevealed(true);
  };

  const handleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(false);
    setRevealed(false);
  };

  return (
    <article
      ref={articleRef}
      className={`portfolio-card group relative overflow-hidden bg-ink-soft ${
        isVideo ? "portfolio-card--video" : ""
      } ${expanded ? "portfolio-card--expanded z-10" : ""}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={handleCardClick}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {isVideo ? (
          <>
            {showPoster && (
              <img
                src={posterSrc}
                alt={item.title}
                className="absolute inset-0 z-[1] h-full w-full object-cover"
              />
            )}
            <video
              ref={videoRef}
              src={loadVideo ? src : undefined}
              muted
              loop
              playsInline
              preload={loadVideo ? "auto" : "none"}
              className={`portfolio-media h-full w-full object-cover transition duration-500 ease-out ${
                playing || !posterSrc ? "opacity-100" : "opacity-0"
              }`}
              onPlaying={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
          </>
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
        <div
          className={`portfolio-overlay absolute inset-0 z-[2] flex flex-col p-6 transition duration-500 ${
            expanded
              ? "justify-between overflow-hidden bg-gradient-to-t bg-ink/92 from-ink via-ink/95 to-ink/85"
              : isVideo
                ? "portfolio-overlay--video justify-end"
                : "justify-end bg-gradient-to-t from-ink via-ink/55 to-transparent"
          } ${showOverlay ? "portfolio-overlay--visible" : ""}`}
        >
          <div className={expanded ? "min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1" : ""}>
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-gold">
              {item.category}
            </span>
            <h3 className="font-[family-name:var(--font-display)] text-2xl text-cream">
              {item.title}
            </h3>
            {hasDescription && (
              <p
                ref={descRef}
                className={`mt-2 text-sm leading-relaxed text-cream-muted ${
                  expanded ? "" : "line-clamp-2"
                }`}
              >
                {item.description}
              </p>
            )}
          </div>
          {hasDescription && canExpand && !expanded && (
            <button
              type="button"
              onClick={handleExpand}
              className="mt-3 self-start text-xs uppercase tracking-[0.18em] text-gold transition hover:text-gold-light"
            >
              Подробнее
            </button>
          )}
          {expanded && (
            <button
              type="button"
              onClick={handleCollapse}
              className="mt-4 shrink-0 self-start text-xs uppercase tracking-[0.18em] text-cream-muted transition hover:text-cream"
            >
              Свернуть
            </button>
          )}
        </div>
        {isVideo && !playing && !showOverlay && (
          <button
            type="button"
            onClick={handlePlayClick}
            className="absolute inset-0 z-[3] flex items-center justify-center"
            aria-label={`Воспроизвести ${item.title}`}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-cream/30 bg-ink/50 backdrop-blur-sm transition group-hover:scale-105 group-hover:border-gold/40">
              <svg className="ml-1 h-5 w-5 text-cream" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </article>
  );
}
