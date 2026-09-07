import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { ForecastHorizonDays } from "@/features/weather/types";
import { getTranslations } from "@/lib/i18n/getTranslations";

import { ForecastHorizonToggle } from "./ForecastHorizonToggle";

for (const availableDays of [3, 6, 7, 10, 14, 15]) {
  for (const horizonDays of [7, 15] satisfies ForecastHorizonDays[]) {
    test(`${availableDays} available days with ${horizonDays} selected disables unsupported horizons`, () => {
      const markup = renderToStaticMarkup(
        <ForecastHorizonToggle
          availableDays={availableDays}
          horizonDays={horizonDays}
          onHorizonChange={() => {}}
          t={getTranslations("fr")}
        />
      );
      const buttons = [...markup.matchAll(/<button\b([^>]*)>/g)];

      assert.equal(buttons.length, 2);
      for (const [index, horizon] of [7, 15].entries()) {
        const attributes = buttons[index][1];
        const disabled = availableDays < horizon;
        assert.equal(attributes.includes('disabled=""'), disabled);
        assert.equal(
          attributes.includes('aria-pressed="true"'),
          !disabled && horizonDays === horizon
        );
      }
    });
  }
}
