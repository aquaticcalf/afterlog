import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { Finalized } from "@/core/types/state"
import type { LoggerAdapter } from "@/core/types/adapters/adapter"

/**
 * options for the console adapter.
 */
interface ConsoleAdapterOptions {
  /**
   * console method to use.
   * @default "log"
   */
  method?: "log" | "info" | "warn" | "error" | "debug"

  /**
   * pretty print with indentation.
   * @default false
   */
  pretty?: boolean

  /**
   * include timestamp prefix.
   * @default false
   */
  includeTimestamp?: boolean
}

/**
 * create a console adapter that logs wide events as json.
 */
function createConsoleAdapter<T extends BaseWideEvent>(
  options: ConsoleAdapterOptions = {},
): LoggerAdapter<T> {
  const { method = "log", pretty = false, includeTimestamp = false } = options

  const format = (event: Finalized<T>): string => {
    let output: string
    if (pretty) {
      output = JSON.stringify(event, null, 2)
    } else {
      output = JSON.stringify(event)
    }

    if (includeTimestamp) {
      output = `[${event.timestamp}] ${output}`
    }

    return output
  }

  return {
    emit(event: Finalized<T>): void {
      console[method](format(event))
    },

    async flush(): Promise<void> {
      // console doesn't buffer, nothing to flush
    },

    async destroy(): Promise<void> {
      // no cleanup needed
    },

    isHealthy(): boolean {
      return typeof console !== "undefined"
    },
  }
}

export { createConsoleAdapter }
export type { ConsoleAdapterOptions }
