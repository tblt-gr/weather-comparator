"use client";

import { useMediaQuery } from "@/lib/useMediaQuery";

// Matches the Tailwind `lg` breakpoint: below it the layout is the mobile one.
const MOBILE_QUERY = "(max-width: 1023px)";

export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}
