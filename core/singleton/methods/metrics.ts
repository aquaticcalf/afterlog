import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { State } from "@/core/singleton/state"
import type { AdapterMetrics } from "@/core/types/adapters"

/**
 * get metrics from singleton state.
 */
function getMetrics<T extends BaseWideEvent>(state: State<T>): AdapterMetrics | null {
  if (!state.configured || !state.adapterManager) {
    return null
  }

  return state.adapterManager.getMetrics()
}

/**
 * check health of singleton state.
 */
async function isHealthy<T extends BaseWideEvent>(state: State<T>): Promise<boolean> {
  if (!state.configured || !state.adapterManager) {
    return false
  }

  return await state.adapterManager.isHealthy()
}

export { getMetrics, isHealthy }
