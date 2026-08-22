import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Button, buttonVariants } from "./button";

test("button variants support opting out of the active press translation", () => {
  assert.match(
    buttonVariants(),
    /active:not-aria-\[haspopup\]:not-data-\[active-translation=off\]:translate-y-px/
  );
});

test("Button renders the active translation opt-out attribute when requested", () => {
  const markup = renderToStaticMarkup(
    <Button disableActiveTranslation type="button">
      Clear
    </Button>
  );

  assert.match(markup, /data-active-translation="off"/);
});

test("coarse pointers receive 44px interactive targets without changing mouse density", () => {
  const styles = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

  assert.equal(styles.includes("@media (pointer: coarse)"), true);
  assert.equal(styles.includes("min-width: 2.75rem;"), true);
  assert.equal(styles.includes("min-height: 2.75rem;"), true);
  assert.equal(styles.includes('[data-slot="checkbox"]::after'), true);
});
