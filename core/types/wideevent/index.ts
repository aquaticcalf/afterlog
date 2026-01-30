import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { HttpWideEvent } from "@/core/types/wideevent/http"
import type { Error } from "@/core/types/wideevent/error"

/**
 * default wide event type
 * includes both base and HTTP fields
 * extendable for any application
 */
interface WideEvent extends HttpWideEvent {
  /**
   * custom application specific fields
   */
  [key: string]: unknown
}

export type { WideEvent, BaseWideEvent, HttpWideEvent, Error as WideEventError }
