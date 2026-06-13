"use client";

import { useState, useEffect } from "react";

const links = [
  { href: "#work", label: "Работы" },
  { href: "#about", label: "Обо мне" },
  { href: "#contact", label: "Контакты" },
];

export function Header({ name }: { name: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled
          ? "bg-ink/90 backdrop-blur-md border-b border-cream/5 py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-10">
        <a
          href="#"
          className="font-[family-name:var(--font-display)] text-xl tracking-wide text-cream lg:text-2xl"
        >
          {name}
        </a>
        <nav className="hidden gap-10 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm uppercase tracking-[0.2em] text-cream-muted transition-colors hover:text-gold"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <a
          href="#contact"
          className="border border-gold/40 px-5 py-2 text-xs uppercase tracking-[0.15em] text-gold transition hover:bg-gold/10"
        >
          Связаться
        </a>
      </div>
    </header>
  );
}
