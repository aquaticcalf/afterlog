import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { LoggerAdapter } from "@/core/types/adapters/adapter"
import type { SamplingConfig } from "@/core/types/sampling/config"
import type { Clock } from "@/core/types/config"

/**
 * configuration for the afterlog singleton.
 */
interface SingletonConfig<T extends BaseWideEvent> {
  /** required: adapter for event emission */
  adapter: LoggerAdapter<T>

  /** optional: sampling configuration */
  sampling?: SamplingConfig

  /** service name */
  service: string

  /** service version */
  version?: string

  /** deployment region */
  region?: string

  /** deployment identifier */
  deployment_id?: string

  /** environment name */
  environment?: string

  /** custom clock */
  clock?: Clock

  /** timeout threshold in ms */
  timeout_ms?: number
}

export type { SingletonConfig }
