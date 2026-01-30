import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { State } from "@/core/singleton/state"
import { Builder } from "@/core/builder"
import { AfterlogNotConfiguredError } from "@/core/singleton/error"

/**
 * create a builder from singleton state.
 */
function createBuilder<T extends BaseWideEvent>(
  state: State<T>,
  init?: {
    request_id?: import("@/utils/id").UUID
    trace_id?: import("@/utils/id").UUID
    method?: string
    path?: string
    headers?: Record<string, string>
  },
): Builder<T> {
  if (!state.configured || !state.config) {
    throw new AfterlogNotConfiguredError()
  }

  const builderConfig = {
    service: state.config.service,
    version: state.config.version,
    region: state.config.region,
    deployment_id: state.config.deployment_id,
    environment: state.config.environment,
    clock: state.config.clock,
    timeout_ms: state.config.timeout_ms,
  }

  return new Builder<T>(builderConfig, init)
}

export { createBuilder }
