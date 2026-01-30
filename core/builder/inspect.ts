import type { State } from "@/core/builder/state"
import type { BaseWideEvent } from "@/core/types/wideevent/base"

/**
 * gets a snapshot of the current event state.
 */
function snapshot<T extends BaseWideEvent>(
  state: State<T>,
  dirty: boolean,
  cached: Partial<T> | null,
): { snapshot: Partial<T>; dirty: false; cached: Partial<T> } {
  if (!dirty && cached) {
    return { snapshot: cached, dirty: false, cached }
  }
  const newSnapshot = { ...state.base, ...state.context }
  return { snapshot: newSnapshot, dirty: false, cached: newSnapshot }
}

export { snapshot }
