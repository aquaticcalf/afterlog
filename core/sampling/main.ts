import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { SamplingDecision, SamplingRule, SamplingConfig } from "@/core/types/sampling"

/**
 * the sampling engine evaluates rules to decide whether to sample events
 * uses tail sampling - decision is made after the event is fully built
 */
class SamplingEngine<T extends BaseWideEvent> {
  private rules: SamplingRule<T>[]
  private defaultRate: number
  private addMetadata: boolean

  constructor(config: SamplingConfig<T>) {
    this.rules = [...config.rules].sort((a, b) => a.priority - b.priority)
    this.defaultRate = config.defaultRate ?? 0.05
    this.addMetadata = config.addSamplingMetadata ?? true
  }

  /**
   * evaluate an event and return the sampling decision
   */
  evaluate(event: T): SamplingDecision {
    for (const rule of this.rules) {
      try {
        const decision = rule.evaluate(event)
        if (decision !== undefined) {
          return decision
        }
      } catch (error) {
        console.warn(`sampling rule '${rule.name}' threw error:`, error)
      }
    }

    const sampled = Math.random() < this.defaultRate
    return {
      sampled,
      rate: this.defaultRate,
      reason: "default",
    }
  }

  /**
   * determine if an event should be sampled and optionally add metadata
   */
  shouldSample(event: T & Record<string, unknown>): boolean {
    const decision = this.evaluate(event as T)

    if (this.addMetadata && decision.sampled) {
      ;(event as Record<string, unknown>)._sampling = {
        rate: decision.rate,
        reason: decision.reason,
        ...decision.metadata,
      }
    }

    return decision.sampled
  }

  /**
   * add a rule dynamically
   */
  addRule(rule: SamplingRule<T>): void {
    this.rules.push(rule)
    this.rules.sort((a, b) => a.priority - b.priority)
  }

  /**
   * remove a rule by name
   */
  removeRule(name: string): boolean {
    const index = this.rules.findIndex((r) => r.name === name)
    if (index >= 0) {
      this.rules.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * get current rules (for debugging)
   */
  getRules(): readonly SamplingRule<T>[] {
    return this.rules
  }
}

export { SamplingEngine }
