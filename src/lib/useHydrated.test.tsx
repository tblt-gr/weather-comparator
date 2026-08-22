import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { useHydrated } from "./useHydrated";

test("uses a stable non-hydrated snapshot during server rendering", () => {
  function HydrationProbe() {
    return <span>{useHydrated() ? "hydrated" : "server"}</span>;
  }

  assert.equal(renderToStaticMarkup(<HydrationProbe />), "<span>server</span>");
});
