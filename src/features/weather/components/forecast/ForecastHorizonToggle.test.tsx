import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { ForecastHorizonDays } from "@/features/weather/types";
import { getTranslations } from "@/lib/i18n/getTranslations";

import { ForecastHorizonToggle } from "./ForecastHorizonToggle";

for (const hasExtendedForecast of [false, true]) {
  for (const horizonDays of [7, 15] satisfies ForecastHorizonDays[]) {
    test(`${hasExtendedForecast ? "extended" : "short"} forecast with ${horizonDays} selected disables unsupported horizons`, () => {
      const markup = renderToStaticMarkup(
        <ForecastHorizonToggle
          hasExtendedForecast={hasExtendedForecast}
          horizonDays={horizonDays}
          onHorizonChange={() => {}}
          t={getTranslations("fr")}
        />
      );
      const buttons = [...markup.matchAll(/<button\b([^>]*)>/g)];

      assert.equal(buttons.length, 2);
      const sevenDayAttributes = buttons[0][1];
      const fifteenDayAttributes = buttons[1][1];

      assert.equal(sevenDayAttributes.includes('disabled=""'), false);
      assert.equal(
        sevenDayAttributes.includes('aria-pressed="true"'),
        horizonDays === 7
      );
      assert.equal(fifteenDayAttributes.includes('disabled=""'), !hasExtendedForecast);
      assert.equal(
        fifteenDayAttributes.includes('aria-pressed="true"'),
        hasExtendedForecast && horizonDays === 15
      );
    });
  }
}
