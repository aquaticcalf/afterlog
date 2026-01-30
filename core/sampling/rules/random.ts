import type { SamplingRule } from "@/core/types/sampling/rule"
import type { SamplingDecision } from "@/core/types/sampling/decision"

/**
 * create a random sampling rule for default fallback
 * this should have the lowest priority (evaluated last)
 */
function createRandomRule(rate: number): SamplingRule {
  return {
    name: "random",
    priority: 1000,

    evaluate(): SamplingDecision {
      const sampled = Math.random() < rate
      return {
        sampled,
        rate,
        reason: "random",
      }
    },
  }
}

export { createRandomRule }
