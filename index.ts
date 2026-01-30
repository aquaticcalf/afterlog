export { Builder, AfterlogError, normalize, extractTraceId } from "@/core/builder"
export type { NormalizedError, Lifecycle, TimingStats, State, Finalized } from "@/core/builder"

export {
  SamplingEngine,
  errorRule,
  createLatencyRule,
  createRandomRule,
  createConsistentRule,
} from "@/core/sampling"
export type { LatencyConfig, ConsistentConfig } from "@/core/sampling"
export type { SamplingDecision, SamplingRule, SamplingConfig } from "@/core/types/sampling"

export { AdapterManager, createConsoleAdapter } from "@/core/adapters"
export type { ConsoleAdapterOptions } from "@/core/adapters"
export type { LoggerAdapter, AdapterMetrics, EmitHook, ErrorHook } from "@/core/types/adapters"

export { afterlog, Afterlog, AfterlogNotConfiguredError } from "@/core/singleton"
export type { SingletonConfig } from "@/core/singleton"

export type {
  WideEvent,
  BaseWideEvent,
  HttpWideEvent,
  WideEventError,
} from "@/core/types/wideevent"
export type { Clock, Enricher, Config, Init } from "@/core/types/config"
export type { UUID } from "@/utils/id"
