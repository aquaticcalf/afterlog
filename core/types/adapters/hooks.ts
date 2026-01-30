import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { Finalized } from "@/core/types/state"

/**
 * hook called before/after emitting an event.
 */
type EmitHook<T extends BaseWideEvent> = (event: Finalized<T>) => void | Promise<void>

/**
 * hook called when emit fails.
 */
type ErrorHook<T extends BaseWideEvent> = (
  error: Error,
  event?: Finalized<T>,
) => void | Promise<void>

export type { EmitHook, ErrorHook }
