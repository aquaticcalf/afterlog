import type { State } from "@/core/builder/state"
import type { BaseWideEvent } from "@/core/types/wideevent/base"
import { deep } from "@/utils/merge"

/**
 * deep merges value into an existing field.
 */
function merge<T extends BaseWideEvent, K extends keyof T>(
  state: State<T>,
  key: K,
  value: unknown,
): { dirty: true } {
  state.lifecycle = "building"
  state.context[key] = deep(state.context[key], value) as T[K]
  return { dirty: true }
}

export { merge }
