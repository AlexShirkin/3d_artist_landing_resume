"use client";

import { motion } from "framer-motion";

interface HeroProps {
  name: string;
  tagline: string;
  heroLabel: string;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function Hero({ name, tagline, heroLabel }: HeroProps) {
  const initials = getInitials(name);

  return (
    <section className="hero-glow relative flex min-h-screen flex-col justify-center overflow-hidden py-28 pt-36 lg:py-32 lg:pt-40">
      <div className="hero-grid pointer-events-none absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-transparent to-ink/80" />

      <div
        aria-hidden
        className="pointer-events-none absolute right-[-4%] top-1/2 hidden -translate-y-1/2 font-[family-name:var(--font-display)] text-[clamp(12rem,22vw,24rem)] font-light leading-none text-cream/[0.035] select-none lg:block xl:right-[2%]"
      >
        {initials}
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-6 lg:grid-cols-12 lg:gap-16 lg:px-10 xl:gap-20">
        <div className="lg:col-span-7 xl:col-span-6">
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

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.35 }}
          className="relative hidden lg:col-span-5 lg:block xl:col-span-6"
        >
          <div className="relative ml-auto aspect-[4/5] w-full max-w-md xl:max-w-lg">
            <div className="absolute inset-0 border border-cream/10" />
            <div className="absolute inset-4 border border-gold/20" />
            <div className="absolute left-0 top-1/2 h-px w-1/2 -translate-y-1/2 bg-gradient-to-r from-gold/50 to-transparent" />
            <div className="absolute bottom-8 right-8 h-24 w-px bg-gradient-to-t from-gold/40 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-[family-name:var(--font-display)] text-7xl italic text-gold/25 xl:text-8xl">
                3D
              </span>
            </div>
          </div>
        </motion.div>
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
