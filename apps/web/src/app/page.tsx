import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { fetchItems, fetchSettings } from "@/lib/api";

// Не обращаемся к API на этапе docker build (gateway ещё не запущен)
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, items, featured] = await Promise.all([
    fetchSettings(),
    fetchItems(),
    fetchItems({ featured: true }),
  ]);

  const s = settings ?? {
    designerName: "Имя дизайнера",
    tagline:
      "Создаю точные 3D-модели одежды, лекала и визуализации для брендов и производства — от эскиза до готового технического пакета.",
    bio: "",
    email: "hello@example.com",
    telegram: "",
    instagram: "",
    yearsExperience: 8,
    heroLabel: "3D-конструктор одежды",
    competencies: [
      "3D-конструирование и лекала",
      "Симуляция ткани (draping)",
      "Технические пакеты для производства",
      "Визуализация и рендер коллекций",
      "Работа с брендами и ателье",
    ],
  };

  const showcase = featured.length > 0 ? featured : items;

  return (
    <main>
      <Header name={s.designerName} />
      <Hero
        name={s.designerName}
        tagline={s.tagline}
        heroLabel={s.heroLabel}
        featuredItem={showcase[0] ?? null}
      />
      <PortfolioGrid
        items={showcase}
        title="Избранные работы"
        subtitle="Видео и анимации процесса 3D-конструирования — наведите курсор, чтобы увидеть детали"
      />
      {items.length > showcase.length && (
        <PortfolioGrid
          items={items.filter((i) => !showcase.find((f) => f.id === i.id))}
          title="Все проекты"
        />
      )}
      <About bio={s.bio} competencies={s.competencies} />
      <Contact
        email={s.email}
        telegram={s.telegram}
        instagram={s.instagram}
      />
      <Footer name={s.designerName} />
    </main>
  );
}
