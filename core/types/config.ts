import type { UUID } from "@/utils/id"
import type { BaseWideEvent } from "@/core/types/wideevent/base"

/**
 * clock interface for timing operations.
 * abstracts performance.now() vs process.hrtime vs Date.now()
 */
interface Clock {
  /** get current time */
  now(): number
  /** calculate elapsed ms since start */
  elapsed(start: number): number
}

/**
 * enricher function that adds context to events.
 * runs at different stages of the lifecycle.
 */
type Enricher<T extends BaseWideEvent> = (
  event: Partial<T>,
  meta: Map<string, unknown>,
) => Partial<T> | void

/**
 * configuration for creating an afterlog instance.
 */
interface Config<T extends BaseWideEvent> {
  /** service name */
  service?: string
  /** service version */
  version?: string
  /** deployment region */
  region?: string
  /** deployment identifier - git sha or build number */
  deployment_id?: string
  /** environment name */
  environment?: string
  /** clock implementation for timing */
  clock?: Clock
  /** enrichers to run during finalization */
  enrichers?: Enricher<T>[]
  /** timeout threshold in ms - requests over this are marked timeout */
  timeout_ms?: number
}

/**
 * initialization data for creating a new builder.
 */
interface Init {
  request_id?: UUID
  trace_id?: UUID
  parent_span_id?: string
  method?: string
  path?: string
  headers?: Record<string, string>
}

export type { Clock, Enricher, Config, Init }
