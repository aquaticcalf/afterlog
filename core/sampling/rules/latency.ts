import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { SamplingRule } from "@/core/types/sampling/rule"
import type { SamplingDecision } from "@/core/types/sampling/decision"

/**
 * configuration for latency-based sampling
 */
interface LatencyConfig {
  /**
   * always sample if duration exceeds this (ms)
   * @default 5000
   */
  alwaysSampleAbove?: number

  /**
   * duration thresholds and sample rates
   * evaluated in order - first match wins
   */
  thresholds?: Array<{
    durationMs: number
    rate: number
  }>
}

/**
 * create a latency-based sampling rule
 * samples slow requests at increasing rates
 */
function createLatencyRule(config: LatencyConfig = {}): SamplingRule {
  const alwaysSampleAbove = config.alwaysSampleAbove ?? 5000
  const thresholds = (
    config.thresholds ?? [
      { durationMs: 2000, rate: 0.5 },
      { durationMs: 1000, rate: 0.25 },
      { durationMs: 500, rate: 0.1 },
    ]
  ).sort((a, b) => b.durationMs - a.durationMs)

  return {
    name: "latency",
    priority: 10,

    evaluate(event: BaseWideEvent & Record<string, unknown>): SamplingDecision | undefined {
      const duration = event.duration_ms
      if (typeof duration !== "number") return undefined

      if (duration >= alwaysSampleAbove) {
        return { sampled: true, rate: 1.0, reason: "very_slow" }
      }

      for (const threshold of thresholds) {
        if (duration >= threshold.durationMs) {
          const sampled = Math.random() < threshold.rate
          return {
            sampled,
            rate: threshold.rate,
            reason: `slow_${threshold.durationMs}ms`,
          }
        }
      }

      return undefined
    },
  }
}

export { createLatencyRule }
export type { LatencyConfig }
