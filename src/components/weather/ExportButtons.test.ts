import assert from "node:assert/strict";
import test from "node:test";

import {
  getChartExportBackground,
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
