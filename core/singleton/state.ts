import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { SingletonConfig } from "@/core/types/singleton"
import { SamplingEngine } from "@/core/sampling"
import { AdapterManager } from "@/core/adapters"

/**
 * internal state of the afterlog singleton.
 */
interface State<T extends BaseWideEvent> {
  config: SingletonConfig<T> | null
  adapterManager: AdapterManager<T> | null
  samplingEngine: SamplingEngine<T> | null
  configured: boolean
}

/**
 * create initial state.
 */
function createState<T extends BaseWideEvent>(): State<T> {
  return {
    config: null,
    adapterManager: null,
    samplingEngine: null,
    configured: false,
  }
}

/**
 * configure the singleton state.
 */
function configure<T extends BaseWideEvent>(state: State<T>, config: SingletonConfig<T>): void {
  if (state.configured) {
    console.warn("afterlog already configured, reconfiguring")
  }

  state.config = config
  state.adapterManager = new AdapterManager(config.adapter)

  if (config.sampling) {
    state.samplingEngine = new SamplingEngine({
      ...config.sampling,
      addSamplingMetadata: false,
    })
  }

  state.configured = true
}

/**
 * destroy the singleton state.
 */
async function destroy<T extends BaseWideEvent>(state: State<T>): Promise<void> {
  if (!state.configured || !state.adapterManager) {
    return
  }

  await state.adapterManager.destroy()
  state.config = null
  state.adapterManager = null
  state.samplingEngine = null
  state.configured = false
}

export type { State }
export { createState, configure, destroy }
