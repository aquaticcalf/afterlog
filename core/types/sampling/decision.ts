/**
 * the result of a sampling decision
 */
interface SamplingDecision {
  /**
   * whether to sample (emit) this event
   */
  sampled: boolean

  /**
   * the sample rate applied (for weight calculation in analytics)
   * 1.0 = 100%, 0.05 = 5%
   */
  rate: number

  /**
   * why this decision was made (for debugging/metrics)
   */
  reason: string

  /**
   * optional: additional metadata about the decision
   */
  metadata?: Record<string, unknown>
}

export type { SamplingDecision }
