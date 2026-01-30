import { describe, test, expect } from "bun:test"
import { AdapterManager } from "@/core/adapters/manager"
import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { Finalized } from "@/core/types/state"
import type { LoggerAdapter } from "@/core/types/adapters"

interface TestEvent extends BaseWideEvent {
  user?: { id: string }
  status_code?: number
}

function createMockAdapter<T extends BaseWideEvent>(
  options: {
    failAfter?: number
    failWith?: Error
  } = {},
): LoggerAdapter<T> & { emitted: Finalized<T>[] } {
  const { failAfter, failWith } = options
  const emitted: Finalized<T>[] = []
  let emitCount = 0

  return {
    emitted,
    async emit(event: Finalized<T>): Promise<void> {
      emitCount++
      if (failAfter !== undefined && emitCount > failAfter) {
        throw failWith ?? new Error("mock adapter failure")
      }
      emitted.push(event)
    },
    async flush(): Promise<void> {},
    isHealthy(): boolean {
      return true
    },
  }
}

describe("adapter manager", () => {
  describe("creation", () => {
    test("creates with adapter", () => {
      const adapter = createMockAdapter<TestEvent>()
      const manager = new AdapterManager<TestEvent>(adapter)

      expect(manager).toBeDefined()
      const metrics = manager.getMetrics()
      expect(metrics.eventsEmitted).toBe(0)
      expect(metrics.eventsFailed).toBe(0)
    })
  })

  describe("emit", () => {
    test("emits event through adapter", async () => {
      const adapter = createMockAdapter<TestEvent>()
      const manager = new AdapterManager<TestEvent>(adapter)

      const event = {
        request_id: "req-123" as import("@/utils/id").UUID,
        trace_id: "trace-456" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
        duration_ms: 100,
        outcome: "success" as const,
      } as Finalized<TestEvent>

      await manager.emit(event)

      expect(adapter.emitted).toHaveLength(1)
      expect(adapter.emitted[0]?.request_id as string).toBe("req-123")
    })

    test("tracks metrics on successful emit", async () => {
      const adapter = createMockAdapter<TestEvent>()
      const manager = new AdapterManager<TestEvent>(adapter)

      const event = {
        request_id: "req-123" as import("@/utils/id").UUID,
        trace_id: "trace-456" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
        duration_ms: 100,
        outcome: "success" as const,
        user: { id: "user-789" },
      } as Finalized<TestEvent>

      await manager.emit(event)

      const metrics = manager.getMetrics()
      expect(metrics.eventsEmitted).toBe(1)
      expect(metrics.eventsFailed).toBe(0)
      expect(metrics.lastEmitTime).not.toBeNull()
      expect(metrics.bytesEmitted).toBeGreaterThan(0)
      expect(metrics.averageEmitDurationMs).toBeGreaterThanOrEqual(0)
    })

    test("tracks metrics on failed emit", async () => {
      const adapter = createMockAdapter<TestEvent>({
        failAfter: 0,
        failWith: new Error("emit failed"),
      })
      const manager = new AdapterManager<TestEvent>(adapter)

      const event = {
        request_id: "req-123" as import("@/utils/id").UUID,
        trace_id: "trace-456" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
        duration_ms: 100,
        outcome: "error" as const,
      } as Finalized<TestEvent>

      try {
        await manager.emit(event)
        expect(false).toBe(true)
      } catch (e) {
        expect((e as Error).message).toBe("emit failed")
      }

      const metrics = manager.getMetrics()
      expect(metrics.eventsEmitted).toBe(0)
      expect(metrics.eventsFailed).toBe(1)
      expect(metrics.lastErrorTime).not.toBeNull()
    })

    test("runs emit hooks before emitting", async () => {
      const adapter = createMockAdapter<TestEvent>()
      const manager = new AdapterManager<TestEvent>(adapter)
      const hookCalls: string[] = []

      manager.onEmit(() => {
        hookCalls.push("hook1")
      })
      manager.onEmit(() => {
        hookCalls.push("hook2")
      })

      const event = {
        request_id: "req-123" as import("@/utils/id").UUID,
        trace_id: "trace-456" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
        duration_ms: 100,
        outcome: "success" as const,
      } as Finalized<TestEvent>

      await manager.emit(event)

      expect(hookCalls).toEqual(["hook1", "hook2"])
      expect(adapter.emitted).toHaveLength(1)
    })

    test("runs error hooks on emit failure", async () => {
      const adapter = createMockAdapter<TestEvent>({
        failAfter: 0,
        failWith: new Error("emit failed"),
      })
      const manager = new AdapterManager<TestEvent>(adapter)
      let errorHookCalled = false
      let receivedError: Error | undefined
      let receivedEvent: Finalized<TestEvent> | undefined

      manager.onError((error, event) => {
        errorHookCalled = true
        receivedError = error
        receivedEvent = event
      })

      const event = {
        request_id: "req-123" as import("@/utils/id").UUID,
        trace_id: "trace-456" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
        duration_ms: 100,
        outcome: "error" as const,
      } as Finalized<TestEvent>

      try {
        await manager.emit(event)
      } catch {}

      expect(errorHookCalled).toBe(true)
      expect(receivedError?.message).toBe("emit failed")
      expect(receivedEvent?.request_id as string).toBe("req-123")
    })

    test("ignores errors in error hooks", async () => {
      const adapter = createMockAdapter<TestEvent>({
        failAfter: 0,
        failWith: new Error("emit failed"),
      })
      const manager = new AdapterManager<TestEvent>(adapter)

      manager.onError(() => {
        throw new Error("hook error")
      })

      const event = {
        request_id: "req-123" as import("@/utils/id").UUID,
        trace_id: "trace-456" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
        duration_ms: 100,
        outcome: "error" as const,
      } as Finalized<TestEvent>

      try {
        await manager.emit(event)
      } catch (e) {
        expect((e as Error).message).toBe("emit failed")
      }
    })
  })

  describe("flush", () => {
    test("calls adapter flush", async () => {
      let flushCalled = false
      const adapter = createMockAdapter<TestEvent>()
      adapter.flush = async () => {
        flushCalled = true
      }

      const manager = new AdapterManager<TestEvent>(adapter)
      await manager.flush()

      expect(flushCalled).toBe(true)
    })

    test("handles adapter without flush", async () => {
      const adapter = createMockAdapter<TestEvent>()
      delete adapter.flush

      const manager = new AdapterManager<TestEvent>(adapter)
      await manager.flush()
    })
  })

  describe("destroy", () => {
    test("flushes and destroys adapter", async () => {
      let flushCalled = false
      let destroyCalled = false

      const adapter = createMockAdapter<TestEvent>()
      adapter.flush = async () => {
        flushCalled = true
      }
      adapter.destroy = async () => {
        destroyCalled = true
      }

      const manager = new AdapterManager<TestEvent>(adapter)
      await manager.destroy()

      expect(flushCalled).toBe(true)
      expect(destroyCalled).toBe(true)
    })
  })

  describe("isHealthy", () => {
    test("returns adapter health status", async () => {
      const adapter = createMockAdapter<TestEvent>()
      adapter.isHealthy = () => true

      const manager = new AdapterManager<TestEvent>(adapter)
      const healthy = await manager.isHealthy()

      expect(healthy).toBe(true)
    })

    test("returns true if adapter has no isHealthy", async () => {
      const adapter = createMockAdapter<TestEvent>()
      delete adapter.isHealthy

      const manager = new AdapterManager<TestEvent>(adapter)
      const healthy = await manager.isHealthy()

      expect(healthy).toBe(true)
    })

    test("returns false on isHealthy error", async () => {
      const adapter = createMockAdapter<TestEvent>()
      adapter.isHealthy = () => {
        throw new Error("health check failed")
      }

      const manager = new AdapterManager<TestEvent>(adapter)
      const healthy = await manager.isHealthy()

      expect(healthy).toBe(false)
    })
  })

  describe("getMetrics", () => {
    test("returns copy of metrics", async () => {
      const adapter = createMockAdapter<TestEvent>()
      const manager = new AdapterManager<TestEvent>(adapter)

      const event = {
        request_id: "req-123" as import("@/utils/id").UUID,
        trace_id: "trace-456" as import("@/utils/id").UUID,
        timestamp: new Date().toISOString(),
        duration_ms: 100,
        outcome: "success" as const,
      } as Finalized<TestEvent>

      await manager.emit(event)

      const metrics1 = manager.getMetrics()
      const metrics2 = manager.getMetrics()

      expect(metrics1).toEqual(metrics2)
      metrics1.eventsEmitted = 999
      expect(manager.getMetrics().eventsEmitted).toBe(1)
    })
  })
})
