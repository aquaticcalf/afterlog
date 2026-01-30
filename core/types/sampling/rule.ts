import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { SamplingDecision } from "@/core/types/sampling/decision"

/**
 * a sampling rule that evaluates an event and decides whether to sample it
 */
interface SamplingRule<T extends BaseWideEvent = BaseWideEvent> {
  /**
   * unique identifier for this rule
   */
  readonly name: string

  /**
   * priority (lower = evaluated first)
   */
  readonly priority: number

  /**
   * evaluate the event and return a decision
   * @returns SamplingDecision if this rule applies, undefined to pass to next rule
   */
  evaluate(event: T): SamplingDecision | undefined
}

export type { SamplingRule }
