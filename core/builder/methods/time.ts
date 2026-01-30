import type { State } from "@/core/builder/state"
import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { Clock } from "@/core/types/config"

/**
 * starts a manual timer with the given name.
 */
function time<T extends BaseWideEvent>(state: State<T>, clock: Clock, name: string): void {
  state.lifecycle = "building"
  if (state.timers.has(name)) {
    console.warn(`timer '${name}' already started`)
  }
  state.timers.set(name, clock.now())
}

export { time }
