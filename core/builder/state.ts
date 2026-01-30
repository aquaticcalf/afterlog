import type { UUID } from "@/utils/id"
import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { Lifecycle } from "@/core/builder/lifecycle"
import type { TimingStats } from "@/core/builder/timing"
import type { NormalizedError } from "@/core/builder/error"

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

export type { State, Finalized }
