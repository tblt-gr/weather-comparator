import type { ExtremeKind } from "@/features/weather/types";

export const EXTREME_KIND_COLORS: Record<ExtremeKind, string> = {
  canicule: "oklch(0.62 0.24 28)",
  vague_de_chaleur: "oklch(0.74 0.18 62)",
  grand_froid: "oklch(0.55 0.22 250)",
  vague_de_froid: "oklch(0.68 0.18 230)",
};
