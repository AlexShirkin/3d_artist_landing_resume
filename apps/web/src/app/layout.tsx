import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { YandexMetrika } from "@/components/YandexMetrika";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "3D-конструктор одежды — Портфолио",
  description: "Портфолио опытного 3D-конструктора одежды: лекала, посадка, визуализация",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ymCounterId = process.env.YM_COUNTER_ID?.trim();

  return (
    <html lang="ru" className={`${display.variable} ${body.variable}`}>
      <body className="grain antialiased">
        {children}
        {ymCounterId ? <YandexMetrika counterId={ymCounterId} /> : null}
      </body>
    </html>
  );
}
