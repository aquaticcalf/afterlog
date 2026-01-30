import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { State } from "@/core/singleton/state"
import { Builder } from "@/core/builder"
import { AfterlogNotConfiguredError } from "@/core/singleton/error"

/**
 * finalize a builder and emit through singleton state.
 */
async function finalize<T extends BaseWideEvent>(
  state: State<T>,
  builder: Builder<T>,
): Promise<void> {
  if (!state.configured || !state.adapterManager) {
    throw new AfterlogNotConfiguredError()
  }

  const event = builder.finalize()

  if (state.samplingEngine) {
    const shouldSample = state.samplingEngine.shouldSample(event as T & Record<string, unknown>)
    if (!shouldSample) {
      return
    }
  }

  await state.adapterManager.emit(event)
}

export { finalize }
