import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { State } from "@/core/singleton/state"
import { AfterlogNotConfiguredError } from "@/core/singleton/error"

/**
 * flush the adapter.
 */
async function flush<T extends BaseWideEvent>(state: State<T>): Promise<void> {
  if (!state.configured || !state.adapterManager) {
    throw new AfterlogNotConfiguredError()
  }

  await state.adapterManager.flush()
}

export { flush }
