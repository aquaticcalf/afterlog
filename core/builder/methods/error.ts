import type { State } from "@/core/builder/state"
import type { BaseWideEvent } from "@/core/types/wideevent/base"
import { normalize } from "@/core/builder/error"

/**
 * captures an error with optional additional context.
 */
function capture<T extends BaseWideEvent>(
  state: State<T>,
  err: unknown,
  context?: Record<string, unknown>,
): { dirty: true } {
  state.lifecycle = "building"
  state.errors.push(normalize(err, context))
  return { dirty: true }
}

/**
 * returns true if any errors have been captured.
 */
function hasErrors<T extends BaseWideEvent>(state: State<T>): boolean {
  return state.errors.length > 0
}

export { capture, hasErrors }
