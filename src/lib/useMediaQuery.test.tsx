import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { useMediaQuery } from "./useMediaQuery";

test("uses a stable false media-query snapshot during server rendering", () => {
  function MediaQueryProbe() {
    return <span>{useMediaQuery("(max-width: 1023px)") ? "match" : "no-match"}</span>;
  }

  assert.equal(renderToStaticMarkup(<MediaQueryProbe />), "<span>no-match</span>");
});
