import assert from "node:assert/strict";
import test from "node:test";

import { createRequestLimiter } from "./requestLimiter";

test("runs every queued request without imposing a selection limit", async () => {
  const limiter = createRequestLimiter(2);
  let activeCount = 0;
  let maximumActiveCount = 0;

  const tasks = Array.from({ length: 5 }, (_, index) =>
    limiter.run(async () => {
      activeCount += 1;
      maximumActiveCount = Math.max(maximumActiveCount, activeCount);
      await new Promise((resolve) => setTimeout(resolve, 0));
      activeCount -= 1;
      return index;
    })
  );

  assert.deepEqual(await Promise.all(tasks), [0, 1, 2, 3, 4]);
  assert.equal(maximumActiveCount, 2);
});

test("rejects a queued request that is aborted before it starts", async () => {
  const limiter = createRequestLimiter(1);
  let releaseFirst = () => {};
  const first = limiter.run(
    () =>
      new Promise<void>((resolve) => {
        releaseFirst = resolve;
      })
  );
  const controller = new AbortController();
  const queued = limiter.run(async () => "queued", controller.signal);

  controller.abort();
  await assert.rejects(queued, { name: "AbortError" });
  releaseFirst();
  await first;
});
