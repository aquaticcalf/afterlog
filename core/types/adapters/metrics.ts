/**
 * metrics tracked by the adapter manager.
 */
interface AdapterMetrics {
  /** total events successfully emitted */
  eventsEmitted: number

  /** total events that failed to emit */
  eventsFailed: number

  /** approximate bytes emitted (estimated from json size) */
  bytesEmitted: number

  /** timestamp of last successful emit */
  lastEmitTime: Date | null

  /** timestamp of last failed emit */
  lastErrorTime: Date | null

  /** average emit duration in milliseconds */
  averageEmitDurationMs: number
}

export type { AdapterMetrics }
