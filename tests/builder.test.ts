import { describe, test, expect } from "bun:test"
import { Builder, AfterlogError } from "@/core/builder/index"
import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { Error as WideEventError } from "@/core/types/wideevent/error"

/**
 * test event type for builder tests.
 */
interface TestEvent extends BaseWideEvent {
  user?: { id: string; tier?: string }
  cart?: { items: number; total: number }
  status_code?: number
  timings?: Record<string, number>
  error?: WideEventError
  errors?: WideEventError[]
}

describe("builder", () => {
  describe("creation", () => {
    test("creates with auto-generated ids", () => {
      const builder = new Builder<TestEvent>({})

      expect(builder.id).toBeDefined()
      expect(builder.state_).toBe("created")
    })

    test("creates with provided ids", () => {
      const builder = new Builder<TestEvent>(
        {},
        {
          request_id: "req-123" as import("@/utils/id").UUID,
          trace_id: "trace-456" as import("@/utils/id").UUID,
        },
      )

      const snapshot = builder.snapshot_()
      expect(snapshot.request_id as string).toBe("req-123")
      expect(snapshot.trace_id as string).toBe("trace-456")
    })

    test("extracts trace id from w3c traceparent header", () => {
      const builder = new Builder<TestEvent>(
        {},
        { headers: { traceparent: "00-abc123def456-789-01" } },
      )

      const snapshot = builder.snapshot_()
      expect(snapshot.trace_id as string).toBe("abc123def456")
    })

    test("extracts trace id from x-request-id header", () => {
      const builder = new Builder<TestEvent>({}, { headers: { "x-request-id": "custom-trace" } })

      const snapshot = builder.snapshot_()
      expect(snapshot.trace_id as string).toBe("custom-trace")
    })
  })

  describe("set", () => {
    test("sets a field", () => {
      const builder = new Builder<TestEvent>({})

      builder.set("status_code", 200)

      const snapshot = builder.snapshot_()
      expect(snapshot.status_code).toBe(200)
      expect(builder.state_).toBe("building")
    })

    test("overwrites existing field", () => {
      const builder = new Builder<TestEvent>({})

      builder.set("status_code", 200).set("status_code", 404)

      const snapshot = builder.snapshot_()
      expect(snapshot.status_code).toBe(404)
    })

    test("throws if already finalized", () => {
      const builder = new Builder<TestEvent>({})
      builder.set("status_code", 200)
      builder.finalize()

      expect(() => builder.set("status_code", 500)).toThrow(AfterlogError)
    })
  })

  describe("merge", () => {
    test("creates field if not exists", () => {
      const builder = new Builder<TestEvent>({})

      builder.merge("user", { id: "user-123" })

      const snapshot = builder.snapshot_()
      expect(snapshot.user).toEqual({ id: "user-123" })
    })

    test("deep merges into existing field", () => {
      const builder = new Builder<TestEvent>({})

      builder.merge("user", { id: "user-123" }).merge("user", { tier: "premium" })

      const snapshot = builder.snapshot_()
      expect(snapshot.user).toEqual({ id: "user-123", tier: "premium" })
    })

    test("does not overwrite with undefined", () => {
      const builder = new Builder<TestEvent>({})

      builder.merge("user", { id: "user-123" }).merge("user", { tier: undefined })

      const snapshot = builder.snapshot_()
      expect(snapshot.user).toEqual({ id: "user-123" })
    })
  })

  describe("enrich", () => {
    test("adds arbitrary field", () => {
      const builder = new Builder<TestEvent>({})

      builder.enrich("custom_field", "custom_value")

      const snapshot = builder.snapshot_() as Record<string, unknown>
      expect(snapshot.custom_field).toBe("custom_value")
    })

    test("warns on sensitive field names", () => {
      const builder = new Builder<TestEvent>({})
      const originalWarn = console.warn
      let warnCalled = false
      console.warn = () => {
        warnCalled = true
      }

      builder.enrich("password", "secret123")
      console.warn = originalWarn

      expect(warnCalled).toBe(true)
    })

    test("throws on empty key", () => {
      const builder = new Builder<TestEvent>({})

      expect(() => builder.enrich("", "value")).toThrow(AfterlogError)
    })
  })

  describe("timing", () => {
    test("measures async function duration", async () => {
      const builder = new Builder<TestEvent>({})

      await builder.timing("database", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return "result"
      })

      const event = builder.finalize()
      expect(event.timings?.database).toBeDefined()
      expect(event.timings?.database).toBeGreaterThanOrEqual(10)
    })

    test("returns function result", async () => {
      const builder = new Builder<TestEvent>({})

      const result = await builder.timing("test", async () => "hello")

      expect(result).toBe("hello")
    })

    test("records timing even if function throws", async () => {
      const builder = new Builder<TestEvent>({})

      try {
        await builder.timing("failing", async () => {
          throw new Error("oops")
        })
      } catch {
        // expected
      }

      const event = builder.finalize()
      expect(event.timings?.failing).toBeDefined()
    })
  })

  describe("time and timeEnd", () => {
    test("measures duration between calls", () => {
      const builder = new Builder<TestEvent>({})

      builder.time("operation")
      // small delay
      for (let i = 0; i < 1000000; i++) {}
      const duration = builder.timeEnd("operation")

      expect(duration).toBeGreaterThanOrEqual(0)
      const event = builder.finalize()
      expect(event.timings?.operation).toBe(duration)
    })

    test("throws if timer does not exist", () => {
      const builder = new Builder<TestEvent>({})

      expect(() => builder.timeEnd("nonexistent")).toThrow(AfterlogError)
    })

    test("warns on duplicate timer start", () => {
      const builder = new Builder<TestEvent>({})
      const originalWarn = console.warn
      let warnCalled = false
      console.warn = () => {
        warnCalled = true
      }

      builder.time("timer")
      builder.time("timer")
      console.warn = originalWarn

      expect(warnCalled).toBe(true)
    })
  })

  describe("error", () => {
    test("captures error instance", () => {
      const builder = new Builder<TestEvent>({})

      builder.error(new Error("something failed"))

      expect(builder.hasErrors()).toBe(true)
      const event = builder.finalize()
      expect(event.error).toBeDefined()
      expect(event.error?.message).toBe("something failed")
      expect(event.error?.type).toBe("Error")
    })

    test("captures string error", () => {
      const builder = new Builder<TestEvent>({})

      builder.error("oops")

      const event = builder.finalize()
      expect(event.error?.message).toBe("oops")
      expect(event.error?.type).toBe("StringError")
    })

    test("captures error with context", () => {
      const builder = new Builder<TestEvent>({})

      builder.error(new Error("failed"), { operation: "payment", amount: 100 })

      const event = builder.finalize()
      expect(event.error?.context).toEqual({ operation: "payment", amount: 100 })
    })

    test("captures multiple errors", () => {
      const builder = new Builder<TestEvent>({})

      builder.error(new Error("first"))
      builder.error(new Error("second"))

      const event = builder.finalize()
      expect(event.errors).toBeDefined()
      expect(event.errors?.length).toBe(2)
    })
  })

  describe("finalize", () => {
    test("calculates duration", () => {
      const builder = new Builder<TestEvent>({})

      builder.set("status_code", 200)
      const event = builder.finalize()

      expect(event.duration_ms).toBeDefined()
      expect(event.duration_ms).toBeGreaterThanOrEqual(0)
    })

    test("sets success outcome by default", () => {
      const builder = new Builder<TestEvent>({})

      const event = builder.finalize()

      expect(event.outcome).toBe("success")
    })

    test("sets error outcome when errors captured", () => {
      const builder = new Builder<TestEvent>({})

      builder.error(new Error("fail"))
      const event = builder.finalize()

      expect(event.outcome).toBe("error")
    })

    test("sets timeout outcome when over threshold", () => {
      const mockClock = {
        now: () => 0,
        elapsed: () => 10000, // simulate 10 seconds
      }

      const builder = new Builder<TestEvent>({
        clock: mockClock,
        timeout_ms: 5000, // 5 second threshold
      })

      const event = builder.finalize()

      expect(event.outcome).toBe("timeout")
    })

    test("returns immutable event", () => {
      const builder = new Builder<TestEvent>({})

      const event = builder.finalize()

      expect(() => {
        ;(event as Record<string, unknown>).outcome = "error"
      }).toThrow()
    })

    test("ends orphaned timers with warning", () => {
      const builder = new Builder<TestEvent>({})
      const originalWarn = console.warn
      let warnCalled = false
      let warnMessage = ""
      console.warn = (msg: string) => {
        warnCalled = true
        warnMessage = msg
      }

      builder.time("orphan")
      builder.finalize()
      console.warn = originalWarn

      expect(warnCalled).toBe(true)
      expect(warnMessage).toContain("orphaned timer")
    })

    test("aggregates multiple timings with same name", async () => {
      const builder = new Builder<TestEvent>({})

      await builder.timing("db", async () => 1)
      await builder.timing("db", async () => 2)

      const event = builder.finalize()
      expect(event.timings?.db).toBeDefined()
    })
  })

  describe("snapshot", () => {
    test("returns current state without finalizing", () => {
      const builder = new Builder<TestEvent>({})

      builder.set("status_code", 200)
      const snapshot = builder.snapshot_()

      expect(snapshot.status_code).toBe(200)
      expect(builder.state_).toBe("building") // not finalized
    })

    test("caches snapshot until modified", () => {
      const builder = new Builder<TestEvent>({})

      const snap1 = builder.snapshot_()
      const snap2 = builder.snapshot_()

      // should be same reference since not modified
      expect(snap1).toBe(snap2)

      builder.set("status_code", 200)
      const snap3 = builder.snapshot_()

      // should be different reference after modification
      expect(snap1).not.toBe(snap3)
    })
  })

  describe("state machine", () => {
    test("transitions: created -> building -> finalizing -> emitted", () => {
      const builder = new Builder<TestEvent>({})

      expect(builder.state_).toBe("created")

      builder.set("status_code", 200)
      expect(builder.state_).toBe("building")

      builder.finalize()
      expect(builder.state_).toBe("emitted")
    })

    test("throws on invalid transition from emitted", () => {
      const builder = new Builder<TestEvent>({})
      builder.set("status_code", 200)
      builder.finalize()

      expect(() => builder.set("user", { id: "test", tier: "test" })).toThrow(AfterlogError)
      expect(() => builder.time("test")).toThrow(AfterlogError)
      expect(() => builder.error("test")).toThrow(AfterlogError)
    })
  })
})
