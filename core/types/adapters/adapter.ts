import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { Finalized } from "@/core/types/state"

/**
 * the fundamental contract between afterlog and logging infrastructure.
 * implement this to bridge wide events to your logger.
 */
interface LoggerAdapter<T extends BaseWideEvent = BaseWideEvent> {
  /**
   * emit a finalized wide event.
   * called once per request after sampling decision.
   */
  emit(event: Finalized<T>): void | Promise<void>

  /**
   * optional: flush any buffered events.
   * called during graceful shutdown.
   */
  flush?(): Promise<void>

  /**
   * optional: clean up resources.
   * called when afterlog instance is destroyed.
   */
  destroy?(): Promise<void>

  /**
   * optional: health check.
   * returns true if adapter is ready to emit.
   */
  isHealthy?(): boolean | Promise<boolean>
}

export type { LoggerAdapter }
