import assert from "node:assert/strict";
import test from "node:test";

import {
  canShareWeatherUrl,
  copyTextToClipboard,
  getChartExportBackground,
  getShareFeedbackLabel,
  shouldIncludeChartExportNode,
} from "./ExportButtons";

test("getChartExportBackground falls back to white when the theme background is empty", () => {
  assert.equal(getChartExportBackground(""), "hsl(0 0% 100%)");
  assert.equal(getChartExportBackground("   "), "hsl(0 0% 100%)");
  assert.equal(getChartExportBackground("oklch(0.97 0 0)"), "oklch(0.97 0 0)");
});

test("shouldIncludeChartExportNode excludes script nodes from chart export", () => {
  assert.equal(shouldIncludeChartExportNode({ tagName: "SCRIPT" } as HTMLElement), false);
  assert.equal(shouldIncludeChartExportNode({ tagName: "DIV" } as HTMLElement), true);
});

test("getShareFeedbackLabel returns the expected transient labels", () => {
  const labels = {
    defaultLabel: "Share",
    errorLabel: "Copy failed",
    successLabel: "Copied link",
  };

  assert.equal(getShareFeedbackLabel("idle", labels), "Share");
  assert.equal(getShareFeedbackLabel("success", labels), "Copied link");
  assert.equal(getShareFeedbackLabel("error", labels), "Copy failed");
});

test("canShareWeatherUrl requires a selected city URL to enable sharing", () => {
  assert.equal(canShareWeatherUrl(null), false);
  assert.equal(canShareWeatherUrl("https://example.com/weather?city=paris"), true);
});

test("copyTextToClipboard prefers navigator.clipboard.writeText", async () => {
  const originalNavigator = globalThis.navigator;
  let copied = "";

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      clipboard: {
        async writeText(value: string) {
          copied = value;
        },
      },
    },
  });

  await copyTextToClipboard("https://example.com/weather");

  assert.equal(copied, "https://example.com/weather");

  if (originalNavigator === undefined) {
    Reflect.deleteProperty(globalThis, "navigator");
  } else {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
  }
});
