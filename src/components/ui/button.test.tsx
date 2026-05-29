import assert from "node:assert/strict";
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
