import type { Lifecycle } from "@/core/builder/lifecycle"
import type { State } from "@/core/builder/state"
import type { BaseWideEvent } from "@/core/types/wideevent/base"
import { AfterlogError } from "@/core/builder/error"

/**
 * asserts the builder is in one of the allowed states.
 * throws if not.
 */
function assert<T extends BaseWideEvent>(state: State<T>, ...allowed: Lifecycle[]): void {
  if (!allowed.includes(state.lifecycle)) {
    throw new AfterlogError(
      `invalid operation in state '${state.lifecycle}'. allowed: ${allowed.join(", ")}`,
    )
  }
}

export { assert }
