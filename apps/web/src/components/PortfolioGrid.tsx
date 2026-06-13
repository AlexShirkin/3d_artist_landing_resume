import { PortfolioCard } from "./PortfolioCard";
import type { PortfolioItem } from "@/lib/api";

export function PortfolioGrid({
  items,
  title,
  subtitle,
}: {
  items: PortfolioItem[];
  title: string;
  subtitle?: string;
}) {
  if (items.length === 0) {
    return (
      <section id="work" className="py-24">
        <div className="mx-auto max-w-7xl px-6 text-center text-cream-muted lg:px-10">
          Работы скоро появятся в портфолио
        </div>
      </section>
    );
  }

  return (
    <section id="work" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-16 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Портфолио</p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-cream lg:text-5xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-cream-muted leading-relaxed">{subtitle}</p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {items.map((item) => (
            <PortfolioCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
