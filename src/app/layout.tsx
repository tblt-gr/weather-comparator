import type { Metadata } from "next";
import { cookies } from "next/headers";

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

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${theme === "dark" ? "dark " : ""}h-full antialiased`}
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <Providers initialLocale={locale} initialTheme={theme}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
