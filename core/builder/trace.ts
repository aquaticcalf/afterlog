import type { UUID } from "@/utils/id"

/**
 * extracts trace id from headers using w3c trace context or custom headers.
 */
function extract(headers?: Record<string, string>): UUID | undefined {
  if (!headers) {
    return undefined
  }

  const traceparent = headers["traceparent"]
  if (traceparent) {
    const parts = traceparent.split("-")
    if (parts.length >= 2) {
      return parts[1] as UUID
    }
  }

  return (headers["x-request-id"] ?? headers["x-trace-id"]) as UUID | undefined
}

export { extract }
