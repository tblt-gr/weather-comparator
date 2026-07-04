import type { MetadataRoute } from "next";
import { cookies } from "next/headers";

import { getTranslations } from "@/lib/i18n/getTranslations";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME } from "@/lib/i18n/locale";
import { resolveLocale } from "@/lib/i18n/resolveLocale";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const cookieStore = await cookies();
  const locale = resolveLocale(
    cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? null,
    undefined,
    DEFAULT_LOCALE
  );
  const t = getTranslations(locale);

  return {
    name: t["app.title"],
    short_name: t["app.title"],
    description: t["app.subtitle"],
    lang: locale,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#eef1f5",
    theme_color: "#eef1f5",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
