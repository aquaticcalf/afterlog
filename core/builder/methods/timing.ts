import type { State } from "@/core/builder/state"
import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { Clock } from "@/core/types/config"
import { add as addTiming } from "@/core/builder/timing"

/**
 * measures the duration of an async function.
 */
async function timing<T extends BaseWideEvent, R>(
  state: State<T>,
  clock: Clock,
  name: string,
  fn: () => R | Promise<R>,
): Promise<{ result: R; dirty: true }> {
  state.lifecycle = "building"
  const start = clock.now()
  try {
    const result = await fn()
    return { result, dirty: true }
  } finally {
    addTiming(state.timings, name, clock.elapsed(start))
  }
}

export { timing }
