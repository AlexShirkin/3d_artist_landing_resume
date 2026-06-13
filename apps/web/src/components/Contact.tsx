interface ContactProps {
  email: string;
  telegram: string;
  instagram: string;
}

export function Contact({ email, telegram, instagram }: ContactProps) {
  return (
    <section id="contact" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 text-center lg:px-10">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Контакты</p>
        <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-cream lg:text-6xl">
          Обсудим ваш проект
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-cream-muted">
          Открыта к сотрудничеству с брендами, дизайн-студиями и производством
        </p>
        <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
          {email && (
            <a
              href={`mailto:${email}`}
              className="text-lg text-gold transition hover:text-gold-light"
            >
              {email}
            </a>
          )}
          {telegram && (
            <a
              href={telegram.startsWith("http") ? telegram : `https://t.me/${telegram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cream-muted transition hover:text-cream"
            >
              Telegram
            </a>
          )}
          {instagram && (
            <a
              href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cream-muted transition hover:text-cream"
            >
              Instagram
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
