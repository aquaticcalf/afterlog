import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { SamplingRule } from "@/core/types/sampling/rule"
import type { SamplingDecision } from "@/core/types/sampling/decision"
import { hash } from "@/utils/hash"
import { get as getPath } from "@/utils/path"

/**
 * configuration for consistent (trace-based) sampling
 */
interface ConsistentConfig {
  /**
   * sample rate (0.0 to 1.0)
   */
  rate: number

  /**
   * field to use for consistent hashing
   * @default "trace_id"
   */
  hashField?: string
}

/**
 * create a consistent sampling rule based on trace_id
 * ensures the same trace always gets the same sampling decision
 * essential for distributed tracing
 */
function createConsistentRule(config: ConsistentConfig): SamplingRule {
  const { rate, hashField = "trace_id" } = config

  return {
    name: "consistent",
    priority: 900,

    evaluate(event: BaseWideEvent & Record<string, unknown>): SamplingDecision | undefined {
      const hashInput = getPath(event, hashField)
      if (!hashInput || typeof hashInput !== "string") return undefined

      const h = hash(hashInput)
      const max = 0xffffffff
      const threshold = Math.floor(rate * max)
      const sampled = h < threshold

      return {
        sampled,
        rate,
        reason: "consistent",
        metadata: { hash_field: hashField },
      }
    },
  }
}

export { createConsistentRule }
export type { ConsistentConfig }
