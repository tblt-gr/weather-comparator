import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";

import { Providers } from "@/app/providers";
import { getTranslations } from "@/lib/i18n/getTranslations";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME } from "@/lib/i18n/locale";
import { resolveLocale } from "@/lib/i18n/resolveLocale";
import { parseTheme, THEME_COOKIE_NAME } from "@/lib/theme/theme";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = resolveLocale(
    cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? null,
    undefined,
    DEFAULT_LOCALE
  );
  const t = getTranslations(locale);

  return {
    title: t["app.title"],
    description: t["app.subtitle"],
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(THEME_COOKIE_NAME)?.value);
  const locale = resolveLocale(
    cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? null,
    undefined,
    DEFAULT_LOCALE
  );
  const t = getTranslations(locale);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${theme === "dark" ? "dark " : ""}h-full antialiased`}
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
        >
          {t["app.skipToContent"]}
        </a>
        <Providers initialLocale={locale} initialTheme={theme}>
          {children}
        </Providers>
        <SpeedInsights />
        <Toaster theme={theme} richColors position="bottom-right" />
      </body>
    </html>
  );
}
