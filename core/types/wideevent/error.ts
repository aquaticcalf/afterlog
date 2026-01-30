/**
 * normalized error information
 */

export interface Error {
  /**
   * error type
   * @example "PaymentError"
   */
  type: string

  /**
   * human readable error message
   * @example "card declined by issuer"
   */
  message: string

  /**
   * machine readable error code
   * @example "card_declined"
   */
  code?: string | null

  /**
   * stack trace
   */
  stack?: string | null

  /**
   * whether this error is retriable
   */
  retriable?: boolean

  /**
   * additional error context
   */
  context?: Record<string, unknown>
}
