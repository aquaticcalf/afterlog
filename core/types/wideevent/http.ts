import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { Error } from "@/core/types/wideevent/error"

/**
 * wide event type for HTTP requests
 * adds HTTP specific fields to the base event
 */
export interface HttpWideEvent extends BaseWideEvent {
  /**
   * HTTP method
   * @example "POST"
   */
  http_method?: string

  /**
   * request path ( without query string )
   * @example "/api/v1/checkout"
   */
  path?: string

  /**
   * query params ( sanitized )
   * @example { "page" : "1", "limit" : "10" }
   */
  query?: Record<string, string>

  /**
   * HTTP status code
   * @example 200
   */
  http_status_code?: number

  /**
   * total request duration in milliseconds
   * @example 1234
   */
  request_duration_ms?: number

  /**
   * request outcome classification
   */
  request_outcome?: "success" | "error" | "timeout" | "cancelled"

  /**
   * request body size in bytes
   */
  request_bytes?: number

  /**
   * response body size in bytes
   */
  response_bytes?: number

  /**
   * captured error information
   */
  error?: Error

  /**
   * timing breakdowns
   * @example { "database" : 450, cache : 5, external_api : 340 }
   */
  timings?: Record<string, number>
}
