import type { State } from "@/core/builder/state"
import type { BaseWideEvent } from "@/core/types/wideevent/base"

/**
 * sets a top-level field on the event.
 */
function set<T extends BaseWideEvent, K extends keyof T>(
  state: State<T>,
  key: K,
  value: T[K],
): { dirty: true } {
  state.lifecycle = "building"
  state.context[key] = value
  return { dirty: true }
}

export { set }
