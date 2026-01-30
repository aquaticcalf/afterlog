import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { SingletonConfig } from "@/core/types/singleton"
import type { State } from "@/core/singleton/state"
import { configure, createState, destroy } from "@/core/singleton/state"
import { createBuilder } from "@/core/singleton/methods/builder"
import { finalize } from "@/core/singleton/methods/finalize"
import { flush } from "@/core/singleton/methods/flush"
import { getMetrics, isHealthy } from "@/core/singleton/methods/metrics"

/**
 * singleton afterlog instance.
 * configure once at startup, use everywhere.
 */
class Afterlog<T extends BaseWideEvent> {
  private state: State<T>

  constructor() {
    this.state = createState<T>()
  }

  configure(config: SingletonConfig<T>): void {
    configure(this.state, config)
  }

  isConfigured(): boolean {
    return this.state.configured
  }

  createBuilder(init?: {
    request_id?: import("@/utils/id").UUID
    trace_id?: import("@/utils/id").UUID
    method?: string
    path?: string
    headers?: Record<string, string>
  }): import("@/core/builder").Builder<T> {
    return createBuilder(this.state, init)
  }

  async finalize(builder: import("@/core/builder").Builder<T>): Promise<void> {
    return finalize(this.state, builder)
  }

  async flush(): Promise<void> {
    return flush(this.state)
  }

  async destroy(): Promise<void> {
    return destroy(this.state)
  }

  async isHealthy(): Promise<boolean> {
    return isHealthy(this.state)
  }

  getMetrics(): import("@/core/types/adapters").AdapterMetrics | null {
    return getMetrics(this.state)
  }

  getAdapterManager(): import("@/core/adapters").AdapterManager<T> | null {
    return this.state.adapterManager
  }

  getSamplingEngine(): import("@/core/sampling").SamplingEngine<T> | null {
    return this.state.samplingEngine
  }
}

export { Afterlog }
