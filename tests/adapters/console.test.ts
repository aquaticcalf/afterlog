import { describe, test, expect } from "bun:test"
import { createConsoleAdapter } from "@/core/adapters/console"
import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { Finalized } from "@/core/types/state"

interface TestEvent extends BaseWideEvent {
  user?: { id: string }
  status_code?: number
}

describe("console adapter", () => {
  describe("creation", () => {
    test("creates with defaults", () => {
      const adapter = createConsoleAdapter<TestEvent>()

      expect(adapter).toBeDefined()
      expect(adapter.emit).toBeDefined()
      expect(adapter.flush).toBeDefined()
      expect(adapter.destroy).toBeDefined()
      expect(adapter.isHealthy).toBeDefined()
    })

    test("isHealthy returns true when console exists", () => {
      const adapter = createConsoleAdapter<TestEvent>()
      expect(adapter.isHealthy?.()).toBe(true)
    })
  })

  describe("emit", () => {
    test("emits event as json", () => {
      const adapter = createConsoleAdapter<TestEvent>()
      const logs: string[] = []

      const originalLog = console.log
      console.log = (msg: string) => logs.push(msg)

      const event = {
        request_id: "req-123" as import("@/utils/id").UUID,
        trace_id: "trace-456" as import("@/utils/id").UUID,
        timestamp: "2024-01-15T10:30:00.000Z",
        duration_ms: 100,
        outcome: "success" as const,
        user: { id: "user-789" },
      } as Finalized<TestEvent>

      adapter.emit(event)

      console.log = originalLog

      expect(logs).toHaveLength(1)
      const parsed = JSON.parse(logs[0] as string)
      expect(parsed.request_id).toBe("req-123")
      expect(parsed.user.id).toBe("user-789")
    })

    test("emits pretty printed json when pretty is true", () => {
      const adapter = createConsoleAdapter<TestEvent>({ pretty: true })
      const logs: string[] = []

      const originalLog = console.log
      console.log = (msg: string) => logs.push(msg)

      const event = {
        request_id: "req-123" as import("@/utils/id").UUID,
        trace_id: "trace-456" as import("@/utils/id").UUID,
        timestamp: "2024-01-15T10:30:00.000Z",
        duration_ms: 100,
        outcome: "success" as const,
      } as Finalized<TestEvent>

      adapter.emit(event)

      console.log = originalLog

      expect(logs).toHaveLength(1)
      expect(logs[0]).toContain("\n")
    })

    test("prefixes with timestamp when includeTimestamp is true", () => {
      const adapter = createConsoleAdapter<TestEvent>({ includeTimestamp: true })
      const logs: string[] = []

      const originalLog = console.log
      console.log = (msg: string) => logs.push(msg)

      const event = {
        request_id: "req-123" as import("@/utils/id").UUID,
        trace_id: "trace-456" as import("@/utils/id").UUID,
        timestamp: "2024-01-15T10:30:00.000Z",
        duration_ms: 100,
        outcome: "success" as const,
      } as Finalized<TestEvent>

      adapter.emit(event)

      console.log = originalLog

      expect(logs).toHaveLength(1)
      expect(logs[0]).toMatch(/^\[2024-01-15T10:30:00\.000Z\]/)
    })

    test("uses specified console method", () => {
      const adapter = createConsoleAdapter<TestEvent>({ method: "info" })
      const infos: string[] = []

      const originalInfo = console.info
      console.info = (msg: string) => infos.push(msg)

      const event = {
        request_id: "req-123" as import("@/utils/id").UUID,
        trace_id: "trace-456" as import("@/utils/id").UUID,
        timestamp: "2024-01-15T10:30:00.000Z",
        duration_ms: 100,
        outcome: "success" as const,
      } as Finalized<TestEvent>

      adapter.emit(event)

      console.info = originalInfo

      expect(infos).toHaveLength(1)
    })
  })

  describe("flush", () => {
    test("flush resolves immediately", async () => {
      const adapter = createConsoleAdapter<TestEvent>()
      await adapter.flush?.()
    })
  })

  describe("destroy", () => {
    test("destroy resolves immediately", async () => {
      const adapter = createConsoleAdapter<TestEvent>()
      await adapter.destroy?.()
    })
  })

  describe("isHealthy", () => {
    test("returns true when console is available", () => {
      const adapter = createConsoleAdapter<TestEvent>()
      expect(adapter.isHealthy?.()).toBe(true)
    })
  })
})
