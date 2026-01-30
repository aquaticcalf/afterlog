import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { SamplingRule } from "@/core/types/sampling/rule"
import type { SamplingDecision } from "@/core/types/sampling/decision"

/**
 * always sample errors - priority 0 (highest)
 */
const errorRule: SamplingRule = {
  name: "error",
  priority: 0,

  evaluate(event: BaseWideEvent & Record<string, unknown>): SamplingDecision | undefined {
    if (event.error) {
      return { sampled: true, rate: 1.0, reason: "error" }
    }

    if (event.status_code && typeof event.status_code === "number" && event.status_code >= 500) {
      return { sampled: true, rate: 1.0, reason: "server_error" }
    }

    return undefined
  },
}

export { errorRule }
