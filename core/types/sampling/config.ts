import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { SamplingRule } from "@/core/types/sampling/rule"

/**
 * configuration for the sampling engine
 */
interface SamplingConfig<T extends BaseWideEvent = BaseWideEvent> {
  /**
   * sampling rules, evaluated in priority order
   */
  rules: SamplingRule<T>[]

  /**
   * default sample rate if no rules match
   * @default 0.05 (5%)
   */
  defaultRate?: number

  /**
   * whether to add sampling metadata to emitted events
   * @default true
   */
  addSamplingMetadata?: boolean
}

export type { SamplingConfig }
