/** Tiny concurrency limiter. Pure (no Raycast imports). */

/**
 * Returns `run(key, task)`, which starts at most `max` tasks at a time per key; the rest wait their
 * turn in order. Different keys don't wait on each other.
 */
export function keyedLimiter(max: number) {
  const active = new Map<string, number>();
  const waiting = new Map<string, (() => void)[]>();

  function release(key: string) {
    const queue = waiting.get(key);
    const next = queue?.shift();
    if (queue && queue.length === 0) waiting.delete(key);
    if (next) {
      // Hand the slot straight to the next waiter so a newcomer can't slip in between.
      next();
      return;
    }
    const n = (active.get(key) ?? 1) - 1;
    if (n > 0) active.set(key, n);
    else active.delete(key);
  }

  return async function run<T>(key: string, task: () => Promise<T>): Promise<T> {
    const n = active.get(key) ?? 0;
    if (n < max) {
      active.set(key, n + 1);
    } else {
      await new Promise<void>((resolve) => {
        const queue = waiting.get(key) ?? [];
        queue.push(resolve);
        waiting.set(key, queue);
      });
    }
    try {
      return await task();
    } finally {
      release(key);
    }
  };
}
