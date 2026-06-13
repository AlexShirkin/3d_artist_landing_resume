export function Footer({ name }: { name: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-cream/5 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-cream-muted sm:flex-row lg:px-10">
        <span>© {year} {name}</span>
        <span className="text-xs uppercase tracking-[0.15em]">
          3D-конструктор одежды
        </span>
      </div>
    </footer>
  );
}
