"use client";

import { motion } from "framer-motion";
import type { PortfolioItem } from "@/lib/api";
import { mediaSrc } from "@/lib/api";

interface HeroProps {
  name: string;
  tagline: string;
  heroLabel: string;
  featuredItem?: PortfolioItem | null;
}

function HeroFeaturedMedia({ item }: { item: PortfolioItem }) {
  const src = mediaSrc(item.mediaUrl);
  const posterSrc = item.thumbnailUrl ? mediaSrc(item.thumbnailUrl) : null;
  const isVideo = item.mediaType === "video";

  return (
    <a
      href="#work"
      className="group relative ml-auto block aspect-[4/5] w-full max-w-md xl:max-w-lg"
      aria-label={`Смотреть работу: ${item.title}`}
    >
      <div className="absolute inset-0 border border-cream/10 transition-colors group-hover:border-gold/25" />
      <div className="absolute inset-4 overflow-hidden border border-gold/20 bg-ink-soft">
        {isVideo ? (
          <video
            src={src}
            poster={posterSrc ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
          />
        ) : (
          <img
            src={src}
            alt={item.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent p-5">
          <span className="block text-[10px] uppercase tracking-[0.25em] text-gold">
            {item.category}
          </span>
          <span className="mt-1 block font-[family-name:var(--font-display)] text-xl text-cream">
            {item.title}
          </span>
        </div>
      </div>
      <div className="pointer-events-none absolute left-0 top-1/2 h-px w-1/2 -translate-y-1/2 bg-gradient-to-r from-gold/50 to-transparent" />
      <div className="pointer-events-none absolute bottom-8 right-8 h-24 w-px bg-gradient-to-t from-gold/40 to-transparent" />
    </a>
  );
}

export function Hero({ name, tagline, heroLabel, featuredItem }: HeroProps) {
  const hasFeatured = Boolean(featuredItem);

  return (
    <section className="hero-glow relative flex min-h-screen flex-col justify-center overflow-hidden py-28 pt-36 lg:py-32 lg:pt-40">
      <div className="hero-grid pointer-events-none absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-transparent to-ink/80" />

      <div
        className={`relative mx-auto w-full max-w-7xl px-6 lg:px-10 ${
          hasFeatured
            ? "grid items-center gap-12 lg:grid-cols-12 lg:gap-16 xl:gap-20"
            : "max-w-4xl"
        }`}
      >
        <div className={hasFeatured ? "lg:col-span-7 xl:col-span-6" : ""}>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6 text-xs uppercase tracking-[0.35em] text-gold"
          >
            {heroLabel}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="font-[family-name:var(--font-display)] text-5xl font-light leading-[1.05] text-cream sm:text-7xl lg:text-[5.5rem] xl:text-[6.25rem] 2xl:text-[7rem]"
          >
            {name.split(" ").map((word, i) => (
              <span key={i} className="block">
                {i === 0 ? (
                  <span className="italic text-gold-light">{word}</span>
                ) : (
                  word
                )}
              </span>
            ))}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-8 max-w-xl text-lg leading-relaxed text-cream-muted xl:max-w-2xl xl:text-xl"
          >
            {tagline}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex flex-wrap gap-6"
          >
            <a
              href="#work"
              className="bg-gold px-8 py-4 text-sm font-medium uppercase tracking-[0.12em] text-ink transition hover:bg-gold-light"
            >
              Смотреть работы
            </a>
            <a
              href="#about"
              className="border border-cream/20 px-8 py-4 text-sm uppercase tracking-[0.12em] text-cream transition hover:border-gold/50"
            >
              Подробнее
            </a>
          </motion.div>
        </div>

        {featuredItem && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.35 }}
            className="hidden lg:col-span-5 lg:block xl:col-span-6"
          >
            <HeroFeaturedMedia item={featuredItem} />
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex h-10 w-6 justify-center rounded-full border border-cream/20 p-2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="h-2 w-0.5 bg-gold"
          />
        </div>
      </motion.div>
    </section>
  );
}
