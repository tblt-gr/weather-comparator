"use client";

import { Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t["lang.ariaLabel"]}
          className="h-11 w-11"
          type="button"
          variant="outline"
        >
          <Globe aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          aria-current={locale === "fr" ? "true" : undefined}
          onClick={() => setLocale("fr")}
        >
          Français
        </DropdownMenuItem>
        <DropdownMenuItem
          aria-current={locale === "en" ? "true" : undefined}
          onClick={() => setLocale("en")}
        >
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
