import assert from "node:assert/strict";
import test from "node:test";

import { getWeatherIconTone, getWeatherPartColor, WEATHER_PART_COLORS } from "./weatherIconTone";

test("getWeatherIconTone maps each condition to a colored icon part", () => {
  assert.equal(getWeatherIconTone("clear"), "sun");
  assert.equal(getWeatherIconTone("mainly_clear"), "sun");
  assert.equal(getWeatherIconTone("partly_cloudy"), "mixed-sun");
  assert.equal(getWeatherIconTone("overcast"), "cloud");
  assert.equal(getWeatherIconTone("unknown"), "cloud");
  assert.equal(getWeatherIconTone("fog"), "fog");
  assert.equal(getWeatherIconTone("drizzle"), "drizzle");
  assert.equal(getWeatherIconTone("rain"), "rain");
  assert.equal(getWeatherIconTone("rain_showers"), "rain");
  assert.equal(getWeatherIconTone("freezing_drizzle"), "ice");
  assert.equal(getWeatherIconTone("freezing_rain"), "ice");
  assert.equal(getWeatherIconTone("snow"), "snow");
  assert.equal(getWeatherIconTone("snow_grains"), "snow");
  assert.equal(getWeatherIconTone("snow_showers"), "snow");
  assert.equal(getWeatherIconTone("thunderstorm"), "bolt");
  assert.equal(getWeatherIconTone("thunderstorm_hail"), "bolt");
});

test("getWeatherPartColor paints sun, rain, snow and bolt parts only", () => {
  assert.equal(getWeatherPartColor("sun", 0, 9), WEATHER_PART_COLORS.sun);
  assert.equal(getWeatherPartColor("cloud", 0, 1), WEATHER_PART_COLORS.cloud);
  assert.equal(getWeatherPartColor("mixed-sun", 0, 6), WEATHER_PART_COLORS.sun);
  assert.equal(getWeatherPartColor("mixed-sun", 5, 6), WEATHER_PART_COLORS.cloud);
  assert.equal(getWeatherPartColor("rain", 0, 4), WEATHER_PART_COLORS.cloud);
  assert.equal(getWeatherPartColor("rain", 1, 4), WEATHER_PART_COLORS.rain);
  assert.equal(getWeatherPartColor("snow", 2, 7), WEATHER_PART_COLORS.snow);
  assert.equal(getWeatherPartColor("bolt", 1, 2), WEATHER_PART_COLORS.bolt);
});
