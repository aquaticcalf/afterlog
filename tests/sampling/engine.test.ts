import { describe, test, expect } from "bun:test"
import { SamplingEngine } from "@/core/sampling/main"
import {
  errorRule,
  createLatencyRule,
  createRandomRule,
  createConsistentRule,
} from "@/core/sampling/rules"
import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { SamplingRule, SamplingDecision } from "@/core/types/sampling"

interface TestEvent extends BaseWideEvent {
  error?: { message: string }
  status_code?: number
  duration_ms?: number
  user?: { tier: string }
}

describe("sampling engine", () => {
  describe("creation", () => {
    test("creates with default rate", () => {
      const engine = new SamplingEngine<TestEvent>({ rules: [] })
      const decision = (
        engine as unknown as { evaluate: (e: TestEvent) => SamplingDecision }
      ).evaluate({} as TestEvent)

      expect(decision.rate).toBe(0.05)
      expect(decision.reason).toBe("default")
    })

    test("creates with custom default rate", () => {
      const engine = new SamplingEngine<TestEvent>({ rules: [], defaultRate: 0.5 })
      const decision = (
        engine as unknown as { evaluate: (e: TestEvent) => SamplingDecision }
      ).evaluate({} as TestEvent)

      expect(decision.rate).toBe(0.5)
    })

    test("sorts rules by priority", () => {
      const lowPriority: SamplingRule<TestEvent> = {
        name: "low",
        priority: 100,
        evaluate: () => undefined,
      }
      const highPriority: SamplingRule<TestEvent> = {
        name: "high",
        priority: 10,
        evaluate: () => undefined,
      }

      const engine = new SamplingEngine<TestEvent>({ rules: [lowPriority, highPriority] })
      const rules = engine.getRules()

      expect(rules[0]?.name).toBe("high")
      expect(rules[1]?.name).toBe("low")
    })
  })

  describe("rule evaluation", () => {
    test("evaluates rules in priority order", () => {
      let evaluated: string[] = []

      const first: SamplingRule<TestEvent> = {
        name: "first",
        priority: 10,
        evaluate: () => {
          evaluated.push("first")
          return undefined
        },
      }
      const second: SamplingRule<TestEvent> = {
        name: "second",
        priority: 20,
        evaluate: () => {
          evaluated.push("second")
          return { sampled: true, rate: 1.0, reason: "test" }
        },
      }
      const third: SamplingRule<TestEvent> = {
        name: "third",
        priority: 30,
        evaluate: () => {
          evaluated.push("third")
          return undefined
        },
      }

      const engine = new SamplingEngine<TestEvent>({ rules: [third, second, first] })
      engine.evaluate({} as TestEvent)

      expect(evaluated).toEqual(["first", "second"])
    })

    test("first matching rule wins", () => {
      const firstMatch: SamplingRule<TestEvent> = {
        name: "first",
        priority: 10,
        evaluate: () => ({ sampled: true, rate: 0.5, reason: "first" }),
      }
      const secondMatch: SamplingRule<TestEvent> = {
        name: "second",
        priority: 20,
        evaluate: () => ({ sampled: true, rate: 1.0, reason: "second" }),
      }

      const engine = new SamplingEngine<TestEvent>({ rules: [secondMatch, firstMatch] })
      const decision = engine.evaluate({} as TestEvent)

      expect(decision.rate).toBe(0.5)
      expect(decision.reason).toBe("first")
    })
  })

  describe("error rule", () => {
    test("always samples when error present", () => {
      const engine = new SamplingEngine<TestEvent>({ rules: [errorRule] })
      const decision = engine.evaluate({
        request_id: "test" as import("@/utils/id").UUID,
        trace_id: "test" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
        error: { message: "something failed" },
      } as TestEvent)

      expect(decision.sampled).toBe(true)
      expect(decision.rate).toBe(1.0)
      expect(decision.reason).toBe("error")
    })

    test("always samples on 5xx status", () => {
      const engine = new SamplingEngine<TestEvent>({ rules: [errorRule] })
      const decision = engine.evaluate({
        request_id: "test" as import("@/utils/id").UUID,
        trace_id: "test" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
        status_code: 500,
      } as TestEvent)

      expect(decision.sampled).toBe(true)
      expect(decision.reason).toBe("server_error")
    })

    test("passes through when no error", () => {
      const engine = new SamplingEngine<TestEvent>({ rules: [errorRule] })
      const decision = engine.evaluate({
        request_id: "test" as import("@/utils/id").UUID,
        trace_id: "test" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
        status_code: 200,
      } as TestEvent)

      expect(decision.reason).toBe("default")
    })
  })

  describe("latency rule", () => {
    test("always samples above threshold", () => {
      const rule = createLatencyRule({ alwaysSampleAbove: 5000 })
      const engine = new SamplingEngine<TestEvent>({ rules: [rule] })
      const decision = engine.evaluate({
        request_id: "test" as import("@/utils/id").UUID,
        trace_id: "test" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
        duration_ms: 6000,
      } as TestEvent)

      expect(decision.sampled).toBe(true)
      expect(decision.rate).toBe(1.0)
      expect(decision.reason).toBe("very_slow")
    })

    test("passes through when duration missing", () => {
      const rule = createLatencyRule()
      const engine = new SamplingEngine<TestEvent>({ rules: [rule] })
      const decision = engine.evaluate({
        request_id: "test" as import("@/utils/id").UUID,
        trace_id: "test" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
      } as TestEvent)

      expect(decision.reason).toBe("default")
    })

    test("passes through when under thresholds", () => {
      const rule = createLatencyRule({
        thresholds: [{ durationMs: 1000, rate: 0.5 }],
      })
      const engine = new SamplingEngine<TestEvent>({ rules: [rule] })
      const decision = engine.evaluate({
        request_id: "test" as import("@/utils/id").UUID,
        trace_id: "test" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
        duration_ms: 100,
      } as TestEvent)

      expect(decision.reason).toBe("default")
    })
  })

  describe("consistent rule", () => {
    test("same trace_id gives same decision", () => {
      const rule = createConsistentRule({ rate: 0.5 })
      const engine = new SamplingEngine<TestEvent>({ rules: [rule] })

      const event = {
        request_id: "test" as import("@/utils/id").UUID,
        trace_id: "abc123" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
      } as TestEvent

      const decisions: boolean[] = []
      for (let i = 0; i < 10; i++) {
        decisions.push(engine.evaluate(event).sampled)
      }

      expect(new Set(decisions).size).toBe(1)
    })

    test("different trace_ids can give different decisions", () => {
      const rule = createConsistentRule({ rate: 0.5 })
      const engine = new SamplingEngine<TestEvent>({ rules: [rule] })

      const decisions: boolean[] = []
      for (let i = 0; i < 100; i++) {
        const event = {
          request_id: "test" as import("@/utils/id").UUID,
          trace_id: `trace-${i}` as import("@/utils/id").UUID,
          timestamp: new Date().toISOString(),
        } as TestEvent
        decisions.push(engine.evaluate(event).sampled)
      }

      expect(new Set(decisions).size).toBeGreaterThan(1)
    })

    test("passes through when trace_id missing", () => {
      const rule = createConsistentRule({ rate: 0.5 })
      const engine = new SamplingEngine<TestEvent>({ rules: [rule] })
      const decision = engine.evaluate({
        request_id: "test" as import("@/utils/id").UUID,
        trace_id: "" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
      } as TestEvent)

      expect(decision.reason).toBe("default")
    })
  })

  describe("shouldSample", () => {
    test("returns true when sampled", () => {
      const engine = new SamplingEngine<TestEvent>({
        rules: [createRandomRule(1.0)],
      })
      const event = {
        request_id: "test" as import("@/utils/id").UUID,
        trace_id: "test" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
      } as unknown as TestEvent & Record<string, unknown>

      expect(engine.shouldSample(event)).toBe(true)
    })

    test("returns false when not sampled", () => {
      const engine = new SamplingEngine<TestEvent>({
        rules: [createRandomRule(0)],
      })
      const event = {
        request_id: "test" as import("@/utils/id").UUID,
        trace_id: "test" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
      } as unknown as TestEvent & Record<string, unknown>

      expect(engine.shouldSample(event)).toBe(false)
    })

    test("adds sampling metadata when sampled", () => {
      const engine = new SamplingEngine<TestEvent>({
        rules: [createRandomRule(1.0)],
      })
      const event = {
        request_id: "test" as import("@/utils/id").UUID,
        trace_id: "test" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
      } as unknown as TestEvent & Record<string, unknown>

      engine.shouldSample(event)

      expect(event._sampling).toEqual({
        rate: 1.0,
        reason: "random",
      })
    })

    test("does not add metadata when not sampled", () => {
      const engine = new SamplingEngine<TestEvent>({
        rules: [createRandomRule(0)],
      })
      const event = {
        request_id: "test" as import("@/utils/id").UUID,
        trace_id: "test" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
      } as unknown as TestEvent & Record<string, unknown>

      engine.shouldSample(event)

      expect((event as Record<string, unknown>)._sampling).toBeUndefined()
    })
  })

  describe("dynamic rules", () => {
    test("addRule inserts and re-sorts", () => {
      const lowPriority: SamplingRule<TestEvent> = {
        name: "low",
        priority: 100,
        evaluate: () => undefined,
      }
      const engine = new SamplingEngine<TestEvent>({ rules: [lowPriority] })

      const highPriority: SamplingRule<TestEvent> = {
        name: "high",
        priority: 10,
        evaluate: () => undefined,
      }
      engine.addRule(highPriority)

      const rules = engine.getRules()
      expect(rules[0]?.name).toBe("high")
      expect(rules[1]?.name).toBe("low")
    })

    test("removeRule by name", () => {
      const rule: SamplingRule<TestEvent> = {
        name: "test",
        priority: 10,
        evaluate: () => undefined,
      }
      const engine = new SamplingEngine<TestEvent>({ rules: [rule] })

      expect(engine.removeRule("test")).toBe(true)
      expect(engine.getRules().length).toBe(0)
    })

    test("removeRule returns false when not found", () => {
      const engine = new SamplingEngine<TestEvent>({ rules: [] })

      expect(engine.removeRule("nonexistent")).toBe(false)
    })
  })

  describe("error handling", () => {
    test("continues when rule throws", () => {
      const throwingRule: SamplingRule<TestEvent> = {
        name: "thrower",
        priority: 10,
        evaluate: () => {
          throw new Error("boom")
        },
      }
      const fallbackRule: SamplingRule<TestEvent> = {
        name: "fallback",
        priority: 20,
        evaluate: () => ({ sampled: true, rate: 1.0, reason: "fallback" }),
      }

      const engine = new SamplingEngine<TestEvent>({ rules: [throwingRule, fallbackRule] })
      const decision = engine.evaluate({} as TestEvent)

      expect(decision.reason).toBe("fallback")
    })

    test("logs warning when rule throws", () => {
      const originalWarn = console.warn
      let warnCalled = false
      let warnMessage = ""
      console.warn = (msg: string) => {
        warnCalled = true
        warnMessage = msg
      }

      const throwingRule: SamplingRule<TestEvent> = {
        name: "bad-rule",
        priority: 10,
        evaluate: () => {
          throw new Error("crash")
        },
      }

      const engine = new SamplingEngine<TestEvent>({ rules: [throwingRule] })
      engine.evaluate({} as TestEvent)

      console.warn = originalWarn

      expect(warnCalled).toBe(true)
      expect(warnMessage).toContain("bad-rule")
    })
  })
})
