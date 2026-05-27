import type { Metadata } from "next";
import { cookies } from "next/headers";

import { Providers } from "@/app/providers";
import { parseTheme, THEME_COOKIE_NAME } from "@/lib/theme/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: "Weather Comparator",
  description: "Daily temperature comparison",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(THEME_COOKIE_NAME)?.value);

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${theme === "dark" ? "dark " : ""}h-full antialiased`}
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <Providers initialTheme={theme}>{children}</Providers>
      </body>
    </html>
  );
}
