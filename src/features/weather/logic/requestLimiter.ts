type PendingTask = () => void;

export function createRequestLimiter(maxConcurrent: number) {
  if (!Number.isInteger(maxConcurrent) || maxConcurrent < 1) {
    throw new Error("maxConcurrent must be a positive integer");
  }

  let activeCount = 0;
  const pendingTasks: PendingTask[] = [];

  function drain() {
    while (activeCount < maxConcurrent && pendingTasks.length > 0) {
      pendingTasks.shift()?.();
    }
  }

  return {
    run<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        let started = false;

        const start = () => {
          started = true;
          signal?.removeEventListener("abort", handleAbort);
          activeCount += 1;

          Promise.resolve()
            .then(task)
            .then(resolve, reject)
            .finally(() => {
              activeCount -= 1;
              drain();
            });
        };

        const handleAbort = () => {
          if (started) {
            return;
          }

          const index = pendingTasks.indexOf(start);
          if (index >= 0) {
            pendingTasks.splice(index, 1);
          }
          reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
        };

        if (signal?.aborted) {
          handleAbort();
          return;
        }

        signal?.addEventListener("abort", handleAbort, { once: true });
        pendingTasks.push(start);
        drain();
      });
    },
  };
}
