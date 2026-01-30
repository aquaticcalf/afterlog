import type { UUID } from "@/utils/id"

/**
 * base fields present in every wide event
 * these are automatically added by afterlog
 */
export interface BaseWideEvent {
  /**
   * unique identifier for this request
   * generated at the request start
   * this is a uuid v4
   */
  readonly request_id: UUID

  /**
   * trace identifier for distributed tracing
   * propagated across service boundaries
   */
  readonly trace_id: UUID

  /**
   * iso 8601 timestamp of when the request started
   * https://www.iso.org/iso-8601-date-and-time-format.html
   */
  readonly timestamp: string

  /**
   * name of the service emitting this event
   * @example "checkout-service"
   */
  service?: string

  /**
   * version of the service
   * this is typed as a string
   * @example "2.4.1"
   */
  version?: string

  /**
   * the deployment region
   * @example "us-east-1"
   */
  region?: string

  /**
   * deployment identifier ( git SHA, build number etc. )
   * @example "a3f5d9c" or "build-1234"
   */
  deployment_id?: string

  /**
   * environment name
   * @example "production" | "staging" | "development"
   */
  environment?: string
}
