import type { State } from "@/core/builder/state"
import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { Clock } from "@/core/types/config"
import { AfterlogError } from "@/core/builder/error"
import { add as addTiming } from "@/core/builder/timing"

/**
 * ends a manual timer and returns the duration in ms.
 */
function timeend<T extends BaseWideEvent>(
  state: State<T>,
  clock: Clock,
  name: string,
): { duration: number; dirty: true } {
  const start = state.timers.get(name)
  if (start === undefined) {
    throw new AfterlogError(`timer '${name}' does not exist`)
  }

  const duration = clock.elapsed(start)
  addTiming(state.timings, name, duration)
  state.timers.delete(name)
  return { duration, dirty: true }
}

export { timeend }
