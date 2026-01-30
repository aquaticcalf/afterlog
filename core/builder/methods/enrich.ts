import type { State } from "@/core/builder/state"
import type { BaseWideEvent } from "@/core/types/wideevent/base"
import { AfterlogError } from "@/core/builder/error"

/**
 * adds a field to the event with validation.
 */
function enrich<T extends BaseWideEvent>(
  state: State<T>,
  key: string,
  value: unknown,
): { dirty: true } {
  if (!key || typeof key !== "string") {
    throw new AfterlogError("enrich key must be a non-empty string")
  }

  const sensitive = ["password", "token", "secret", "auth", "credential", "key"]
  if (sensitive.some((s) => key.toLowerCase().includes(s))) {
    console.warn(`potentially sensitive field '${key}' being logged`)
  }

  state.lifecycle = "building"
  ;(state.context as Record<string, unknown>)[key] = value
  return { dirty: true }
}

export { enrich }
