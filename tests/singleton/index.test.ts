import { describe, test, expect } from "bun:test"
import { afterlog, Afterlog, AfterlogNotConfiguredError } from "@/core/singleton/index"
import { createConsoleAdapter } from "@/core/adapters/console"
import { errorRule } from "@/core/sampling/rules"
import type { BaseWideEvent } from "@/core/types/wideevent/base"

interface TestEvent extends BaseWideEvent {
  user?: { id: string }
  status_code?: number
  error?: { message: string }
  method?: string
  path?: string
}

describe("afterlog singleton", () => {
  describe("configuration", () => {
    test("starts unconfigured", () => {
      const instance = new Afterlog<TestEvent>()
      expect(instance.isConfigured()).toBe(false)
    })

    test("configure sets up instance", () => {
      const instance = new Afterlog<TestEvent>()
      const adapter = createConsoleAdapter<TestEvent>()

      instance.configure({
        adapter,
        service: "test-service",
        version: "1.0.0",
      })

      expect(instance.isConfigured()).toBe(true)
      expect(instance.getAdapterManager()).not.toBeNull()
    })

    test("configure with sampling", () => {
      const instance = new Afterlog<TestEvent>()
      const adapter = createConsoleAdapter<TestEvent>()

      instance.configure({
        adapter,
        service: "test-service",
        sampling: {
          rules: [errorRule],
          defaultRate: 0.1,
        },
      })

      expect(instance.getSamplingEngine()).not.toBeNull()
    })
  })

  describe("createBuilder", () => {
    test("throws if not configured", () => {
      const instance = new Afterlog<TestEvent>()
      expect(() => instance.createBuilder()).toThrow(AfterlogNotConfiguredError)
    })

    test("creates builder with service metadata", () => {
      const instance = new Afterlog<TestEvent>()
      const adapter = createConsoleAdapter<TestEvent>()

      instance.configure({
        adapter,
        service: "my-service",
        version: "2.0.0",
        region: "us-east-1",
        environment: "production",
      })

      const builder = instance.createBuilder()
      const snapshot = builder.snapshot_()

      expect(snapshot.service).toBe("my-service")
      expect(snapshot.version).toBe("2.0.0")
      expect(snapshot.region).toBe("us-east-1")
      expect(snapshot.environment).toBe("production")
    })

    test("creates builder with init data", () => {
      const instance = new Afterlog<TestEvent>()
      const adapter = createConsoleAdapter<TestEvent>()

      instance.configure({
        adapter,
        service: "test-service",
      })

      const builder = instance.createBuilder({
        request_id: "req-test" as import("@/utils/id").UUID,
        trace_id: "trace-test" as import("@/utils/id").UUID,
      })

      const snapshot = builder.snapshot_()
      expect(snapshot.request_id as string).toBe("req-test")
      expect(snapshot.trace_id as string).toBe("trace-test")
    })
  })

  describe("finalize", () => {
    test("throws if not configured", async () => {
      const instance = new Afterlog<TestEvent>()
      const builder = new (await import("@/core/builder")).Builder<TestEvent>({
        service: "test",
      })

      expect(async () => await instance.finalize(builder)).toThrow(AfterlogNotConfiguredError)
    })

    test("finalizes and emits event", async () => {
      const instance = new Afterlog<TestEvent>()
      const logs: string[] = []

      const originalLog = console.log
      console.log = (msg: string) => logs.push(msg)

      const adapter = createConsoleAdapter<TestEvent>()
      instance.configure({
        adapter,
        service: "test-service",
      })

      const builder = instance.createBuilder({
        method: "GET",
        path: "/api/test",
      })

      builder.set("user", { id: "user-123" })
      builder.set("status_code", 200)

      await instance.finalize(builder)

      console.log = originalLog

      expect(logs).toHaveLength(1)
      const event = JSON.parse(logs[0] as string)
      expect(event.service).toBe("test-service")
      expect(event.user.id).toBe("user-123")
      expect(event.status_code).toBe(200)
    })

    test("applies sampling and drops events", async () => {
      const instance = new Afterlog<TestEvent>()
      const logs: string[] = []

      const originalLog = console.log
      console.log = (msg: string) => logs.push(msg)

      const adapter = createConsoleAdapter<TestEvent>()
      instance.configure({
        adapter,
        service: "test-service",
        sampling: {
          rules: [],
          defaultRate: 0,
        },
      })

      const builder = instance.createBuilder()
      builder.set("status_code", 200)

      await instance.finalize(builder)

      console.log = originalLog

      expect(logs).toHaveLength(0)
    })

    test("keeps events that pass sampling", async () => {
      const instance = new Afterlog<TestEvent>()
      const logs: string[] = []

      const originalLog = console.log
      console.log = (msg: string) => logs.push(msg)

      const adapter = createConsoleAdapter<TestEvent>()
      instance.configure({
        adapter,
        service: "test-service",
        sampling: {
          rules: [errorRule],
          defaultRate: 0,
        },
      })

      const builder = instance.createBuilder()
      builder.error(new Error("test error"))

      await instance.finalize(builder)

      console.log = originalLog

      expect(logs).toHaveLength(1)
    })
  })

  describe("flush", () => {
    test("throws if not configured", async () => {
      const instance = new Afterlog<TestEvent>()
      expect(async () => await instance.flush()).toThrow(AfterlogNotConfiguredError)
    })

    test("flushes adapter", async () => {
      const instance = new Afterlog<TestEvent>()
      let flushCalled = false

      const adapter = createConsoleAdapter<TestEvent>()
      adapter.flush = async () => {
        flushCalled = true
      }

      instance.configure({
        adapter,
        service: "test-service",
      })

      await instance.flush()

      expect(flushCalled).toBe(true)
    })
  })

  describe("destroy", () => {
    test("returns silently if not configured", async () => {
      const instance = new Afterlog<TestEvent>()
      await instance.destroy()
      expect(instance.isConfigured()).toBe(false)
    })

    test("destroys and resets state", async () => {
      const instance = new Afterlog<TestEvent>()
      const adapter = createConsoleAdapter<TestEvent>()

      instance.configure({
        adapter,
        service: "test-service",
      })

      expect(instance.isConfigured()).toBe(true)

      await instance.destroy()

      expect(instance.isConfigured()).toBe(false)
      expect(instance.getAdapterManager()).toBeNull()
      expect(instance.getSamplingEngine()).toBeNull()
    })
  })

  describe("isHealthy", () => {
    test("returns false if not configured", async () => {
      const instance = new Afterlog<TestEvent>()
      expect(await instance.isHealthy()).toBe(false)
    })

    test("returns adapter health status", async () => {
      const instance = new Afterlog<TestEvent>()
      const adapter = createConsoleAdapter<TestEvent>()

      instance.configure({
        adapter,
        service: "test-service",
      })

      expect(await instance.isHealthy()).toBe(true)
    })
  })

  describe("getMetrics", () => {
    test("returns null if not configured", () => {
      const instance = new Afterlog<TestEvent>()
      expect(instance.getMetrics()).toBeNull()
    })

    test("returns metrics after emitting", async () => {
      const instance = new Afterlog<TestEvent>()
      const adapter = createConsoleAdapter<TestEvent>()

      instance.configure({
        adapter,
        service: "test-service",
        sampling: {
          rules: [],
          defaultRate: 1,
        },
      })

      const builder = instance.createBuilder()
      builder.set("status_code", 200)

      await instance.finalize(builder)

      const metrics = instance.getMetrics()
      expect(metrics).not.toBeNull()
      expect(metrics?.eventsEmitted).toBe(1)
      expect(metrics?.eventsFailed).toBe(0)
    })
  })

  describe("global afterlog instance", () => {
    test("is a singleton", () => {
      expect(afterlog).toBeDefined()
      expect(typeof afterlog.configure).toBe("function")
    })
  })
})
