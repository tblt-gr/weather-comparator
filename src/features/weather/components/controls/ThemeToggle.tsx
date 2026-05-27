"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";

export function ThemeToggle() {
  const { t } = useLocale();
  const { setTheme, theme } = useTheme();
  const isDark = theme === "dark";

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  return (
    <Button
      aria-label={isDark ? t["theme.lightAriaLabel"] : t["theme.darkAriaLabel"]}
      onClick={toggleTheme}
      size="icon"
      type="button"
      variant="outline"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
