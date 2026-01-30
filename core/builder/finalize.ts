import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { State } from "@/core/builder/state"
import type { Clock } from "@/core/types/config"
import { add as addTiming } from "@/core/builder/timing"

/**
 * builds the final event object from builder state.
 */
function build<T extends BaseWideEvent>(
  state: State<T>,
  clock: Clock,
  timeoutMs?: number,
): T & { duration_ms: number; outcome: "success" | "error" | "timeout" | "cancelled" } {
  for (const [name, start] of state.timers) {
    const duration = clock.elapsed(start)
    addTiming(state.timings, name, duration)
    console.warn(`orphaned timer '${name}' ended automatically`)
  }
  state.timers.clear()

  const duration_ms = clock.elapsed(state.startTime)

  const timings: Record<string, number> = {}
  for (const [name, stats] of state.timings) {
    timings[name] = stats.total_ms
  }

  let outcome: "success" | "error" | "timeout" | "cancelled" = "success"
  if (state.errors.length > 0) {
    outcome = "error"
  } else if (timeoutMs && duration_ms > timeoutMs) {
    outcome = "timeout"
  }

  return {
    ...state.base,
    ...state.context,
    duration_ms,
    timings: Object.keys(timings).length > 0 ? timings : undefined,
    error: state.errors.length === 1 ? state.errors[0] : undefined,
    errors: state.errors.length > 1 ? state.errors : undefined,
    outcome,
  } as unknown as T & {
    duration_ms: number
    outcome: "success" | "error" | "timeout" | "cancelled"
  }
}

export { build }
