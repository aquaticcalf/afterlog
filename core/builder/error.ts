import type { Error as WideEventError } from "@/core/types/wideevent/error"

/**
 * afterlog error - thrown on invalid state transitions.
 */
class AfterlogError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AfterlogError"
  }
}

/**
 * normalized error with full context.
 */
interface NormalizedError extends WideEventError {
  original: unknown
}

/**
 * normalizes any thrown value into a structured error.
 */
function normalize(err: unknown, context?: Record<string, unknown>): NormalizedError {
  if (typeof err === "string") {
    return {
      type: "StringError",
      message: err,
      code: null,
      stack: null,
      context,
      original: err,
    }
  }

  if (err instanceof Error) {
    const errorWithProps = err as Error & {
      code?: string
      retriable?: boolean
      statusCode?: number
    }
    return {
      type: err.constructor.name,
      message: err.message,
      code: errorWithProps.code ?? null,
      stack: err.stack ?? null,
      retriable: errorWithProps.retriable,
      context,
      original: err,
      ...(errorWithProps.statusCode && { statusCode: errorWithProps.statusCode }),
    }
  }

  if (typeof err === "object" && err !== null && "message" in err) {
    const errObj = err as { message: unknown; code?: string }
    return {
      type: "ObjectError",
      message: String(errObj.message),
      code: errObj.code ?? null,
      stack: null,
      context,
      original: err,
    }
  }

  return {
    type: "UnknownError",
    message: String(err),
    code: null,
    stack: null,
    context,
    original: err,
  }
}

export { AfterlogError, normalize }
export type { NormalizedError }
