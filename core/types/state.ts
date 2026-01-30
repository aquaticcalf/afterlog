import type { UUID } from "@/utils/id"
import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { Error as WideEventError } from "@/core/types/wideevent/error"

/**
 * lifecycle states for the builder.
 */
type Lifecycle = "created" | "building" | "finalizing" | "emitted" | "dropped"

/**
 * timing statistics when multiple operations use the same name.
 */
interface TimingStats {
  count: number
  total_ms: number
  min_ms: number
  max_ms: number
  avg_ms: number
}

/**
 * normalized error with full context.
 */
interface NormalizedError extends WideEventError {
  original: unknown
}

/**
 * internal state of the wide event builder.
 * this is not exposed to users directly.
 */
interface State<T extends BaseWideEvent> {
  /** unique id for this builder instance */
  readonly id: UUID

  /** current lifecycle state */
  lifecycle: Lifecycle

  /** when the request started - high precision */
  readonly startTime: number

  /** base fields that are immutable after creation */
  readonly base: {
    readonly request_id: UUID
    readonly trace_id: UUID
    readonly timestamp: string
    readonly service?: string
    readonly version?: string
    readonly region?: string
    readonly deployment_id?: string
    readonly environment?: string
  }

  /** accumulated context fields */
  context: Partial<T>

  /** active timers - name to start time */
  timers: Map<string, number>

  /** completed timings - name to stats */
  timings: Map<string, TimingStats>

  /** captured errors */
  errors: NormalizedError[]

  /** metadata for enrichers */
  meta: Map<string, unknown>
}

/**
 * event after finalization - immutable and ready for emission.
 */
type Finalized<T extends BaseWideEvent> = Readonly<
  T & {
    readonly duration_ms: number
    readonly outcome: "success" | "error" | "timeout" | "cancelled"
  }
>

export type { Lifecycle, TimingStats, NormalizedError, State, Finalized }
