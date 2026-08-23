import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("llms.txt follows the recommended Markdown structure", () => {
  const llms = readFileSync(new URL("../../public/llms.txt", import.meta.url), "utf8");

  assert.match(llms, /^# Weather Comparator$/m);
  assert.match(llms, /^> .+$/m);
  assert.match(llms, /^## Resources$/m);
  assert.match(llms, /^- \[[^\]]+\]\([^)]+\)(?:: .+)?$/m);
});
