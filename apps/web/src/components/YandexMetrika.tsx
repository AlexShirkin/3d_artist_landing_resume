"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { Suspense, useEffect } from "react";

declare global {
  interface Window {
    ym?: (counterId: number, method: string, ...args: unknown[]) => void;
  }
}

function MetrikaTracker({ counterId }: { counterId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const numericId = Number(counterId);

  useEffect(() => {
    if (!Number.isFinite(numericId) || typeof window.ym !== "function") return;

    const query = searchParams.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    window.ym(numericId, "hit", url);
  }, [numericId, pathname, searchParams]);

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`(function(m,e,t,r,i,k,a){
m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=${numericId}", "ym");

ym(${numericId}, "init", {
  ssr: true,
  webvisor: true,
  clickmap: true,
  ecommerce: "dataLayer",
  referrer: document.referrer,
  url: location.href,
  accurateTrackBounce: true,
  trackLinks: true
});`}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${numericId}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}

export function YandexMetrika({ counterId }: { counterId: string }) {
  if (!/^\d+$/.test(counterId)) return null;

  return (
    <Suspense fallback={null}>
      <MetrikaTracker counterId={counterId} />
    </Suspense>
  );
}
