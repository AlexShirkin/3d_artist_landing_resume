import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Админка — Портфолио",
  robots: "noindex",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
