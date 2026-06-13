"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { clearToken, getToken } from "@/lib/api";

const nav = [
  { href: "/dashboard", label: "Работы" },
  { href: "/dashboard/settings", label: "Сайт" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  function logout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-semibold text-accent">Портфолио · Админ</span>
          <nav className="flex gap-6">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`text-sm ${
                  pathname === n.href ? "text-accent" : "text-muted hover:text-text"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={logout}
            className="text-sm text-muted hover:text-text"
          >
            Выйти
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
