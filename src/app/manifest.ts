import type { MetadataRoute } from "next";
import { cookies } from "next/headers";

import { getTranslations } from "@/lib/i18n/getTranslations";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME } from "@/lib/i18n/locale";
import { resolveLocale } from "@/lib/i18n/resolveLocale";
import { parseTheme, THEME_COLORS, THEME_COOKIE_NAME } from "@/lib/theme/theme";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const cookieStore = await cookies();
  const locale = resolveLocale(
    cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? null,
    undefined,
    DEFAULT_LOCALE
  );
  const t = getTranslations(locale);
  const theme = parseTheme(cookieStore.get(THEME_COOKIE_NAME)?.value);
  const barColor = THEME_COLORS[theme];

  return {
    name: t["app.title"],
    short_name: t["app.title"],
    description: t["app.subtitle"],
    lang: locale,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: barColor,
    theme_color: barColor,
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
