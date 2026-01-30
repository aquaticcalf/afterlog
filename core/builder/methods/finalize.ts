import type { State, Finalized } from "@/core/builder/state"
import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { Config } from "@/core/types/config"
import type { Clock } from "@/core/types/config"
import { build } from "@/core/builder/finalize"
import { freeze } from "@/utils/freeze"

/**
 * finalizes the event and makes it immutable.
 */
function finalize<T extends BaseWideEvent>(
  state: State<T>,
  clock: Clock,
  config: Config<T>,
): Finalized<T> {
  state.lifecycle = "finalizing"

  const event = build(state, clock, config.timeout_ms)

  if (config.enrichers) {
    for (const enricher of config.enrichers) {
      try {
        const result = enricher(event as Partial<T>, state.meta)
        if (result) Object.assign(event, result)
      } catch (e) {
        console.error("enricher failed:", e)
      }
    }
  }

  state.lifecycle = "emitted"
  return freeze(event) as Finalized<T>
}

export { finalize }
