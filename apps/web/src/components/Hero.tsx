"use client";

import { motion } from "framer-motion";

interface HeroProps {
  name: string;
  tagline: string;
  years: number;
  heroLabel: string;
}

export function Hero({ name, tagline, years, heroLabel }: HeroProps) {
  return (
    <section className="hero-glow relative flex min-h-screen flex-col justify-end overflow-hidden pb-24 pt-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink/20 to-ink" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 text-xs uppercase tracking-[0.35em] text-gold"
        >
          {heroLabel} · {years}+ лет опыта
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="font-[family-name:var(--font-display)] text-5xl font-light leading-[1.05] text-cream sm:text-7xl lg:text-[5.5rem]"
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
          className="mt-8 max-w-xl text-lg leading-relaxed text-cream-muted"
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
