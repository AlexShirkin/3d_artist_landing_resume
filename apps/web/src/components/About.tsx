interface AboutProps {
  bio: string;
  years: number;
}

const skills = [
  "3D-конструирование и лекала",
  "Симуляция ткани (draping)",
  "Технические пакеты для производства",
  "Визуализация и рендер коллекций",
  "Работа с брендами и ателье",
];

export function About({ bio, years }: AboutProps) {
  return (
    <section id="about" className="border-t border-cream/5 bg-ink-soft py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2 lg:gap-24 lg:px-10">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Обо мне</p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-cream lg:text-5xl">
            Опыт, который видно в каждой детали
          </h2>
          <p className="mt-6 leading-relaxed text-cream-muted whitespace-pre-line">
            {bio ||
              `Более ${years} лет в индустрии моды как 3D-конструктор одежды. Создаю точные цифровые модели, лекала и визуализации — от концепта до готового производственного пакета.`}
          </p>
        </div>
        <div>
          <p className="mb-6 text-xs uppercase tracking-[0.2em] text-cream-muted">
            Компетенции
          </p>
          <ul className="space-y-4">
            {skills.map((s, i) => (
              <li
                key={s}
                className="flex items-start gap-4 border-b border-cream/5 pb-4"
              >
                <span className="font-[family-name:var(--font-display)] text-2xl text-gold/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-cream">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
