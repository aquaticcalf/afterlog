import type { Clock } from "@/core/types/config"

/**
 * creates a clock using the best available timing mechanism.
 * prefers performance.now() for sub-ms precision.
 * falls back to Date.now() in older environments.
 */
function create(): Clock {
  if (typeof performance !== "undefined" && performance.now) {
    return {
      now: () => performance.now(),
      elapsed: (start: number) => Math.round(performance.now() - start),
    }
  }

  return {
    now: () => Date.now(),
    elapsed: (start: number) => Date.now() - start,
  }
}

export { create }
