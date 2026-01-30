import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { Finalized } from "@/core/types/state"
import type { LoggerAdapter } from "@/core/types/adapters/adapter"
import type { AdapterMetrics } from "@/core/types/adapters/metrics"
import type { EmitHook, ErrorHook } from "@/core/types/adapters/hooks"

/**
 * manages adapter lifecycle, metrics, and hooks.
 * wraps a logger adapter with observability and error handling.
 */
class AdapterManager<T extends BaseWideEvent> {
  private adapter: LoggerAdapter<T>
  private emitHooks: EmitHook<T>[] = []
  private errorHooks: ErrorHook<T>[] = []
  private metrics: AdapterMetrics = {
    eventsEmitted: 0,
    eventsFailed: 0,
    bytesEmitted: 0,
    lastEmitTime: null,
    lastErrorTime: null,
    averageEmitDurationMs: 0,
  }
  private totalEmitDuration = 0

  constructor(adapter: LoggerAdapter<T>) {
    this.adapter = adapter
  }

  /**
   * emit an event through the adapter.
   * runs hooks, tracks metrics, handles errors.
   */
  async emit(event: Finalized<T>): Promise<void> {
    const startTime = performance.now()

    try {
      for (const hook of this.emitHooks) {
        await hook(event)
      }

      await this.adapter.emit(event)

      const duration = performance.now() - startTime
      this.metrics.eventsEmitted++
      this.metrics.bytesEmitted += this.estimateSize(event)
      this.metrics.lastEmitTime = new Date()
      this.totalEmitDuration += duration
      this.metrics.averageEmitDurationMs = this.totalEmitDuration / this.metrics.eventsEmitted
    } catch (error) {
      this.metrics.eventsFailed++
      this.metrics.lastErrorTime = new Date()

      for (const hook of this.errorHooks) {
        try {
          await hook(error as Error, event)
        } catch {
          // ignore hook errors
        }
      }

      throw error
    }
  }

  /**
   * register a hook to run before emit.
   */
  onEmit(hook: EmitHook<T>): void {
    this.emitHooks.push(hook)
  }

  /**
   * register a hook to run on emit error.
   */
  onError(hook: ErrorHook<T>): void {
    this.errorHooks.push(hook)
  }

  /**
   * flush any buffered events.
   */
  async flush(): Promise<void> {
    await this.adapter.flush?.()
  }

  /**
   * destroy the adapter and clean up.
   */
  async destroy(): Promise<void> {
    await this.flush()
    await this.adapter.destroy?.()
  }

  /**
   * check if adapter is healthy.
   */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.adapter.isHealthy?.()
      return result ?? true
    } catch {
      return false
    }
  }

  /**
   * get current metrics.
   */
  getMetrics(): AdapterMetrics {
    return { ...this.metrics }
  }

  /**
   * estimate event size for metrics.
   */
  private estimateSize(event: Finalized<T>): number {
    try {
      return JSON.stringify(event).length
    } catch {
      return 0
    }
  }
}

export { AdapterManager }
