export { AdapterManager, createConsoleAdapter } from "@/core/adapters/index"
export type { ConsoleAdapterOptions } from "@/core/adapters/index"
export type {
  LoggerAdapter,
  AdapterMetrics,
  EmitHook,
  ErrorHook,
} from "@/core/types/adapters/index"

export { afterlog, Afterlog, AfterlogNotConfiguredError } from "@/core/singleton/index"
export type { SingletonConfig } from "@/core/singleton/index"
