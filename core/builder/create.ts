import type { State } from "@/core/builder/state"
import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { Config, Init } from "@/core/types/config"
import type { Clock } from "@/core/types/config"
import { generateID } from "@/utils/id"
import { extract } from "@/core/builder/trace"
import { create as createClock } from "@/utils/clock"

/**
 * creates the initial state for a new builder.
 */
function create<T extends BaseWideEvent>(
  config: Config<T>,
  init?: Init,
): { state: State<T>; clock: Clock } {
  const clock = config.clock ?? createClock()

  const requestId = init?.request_id ?? generateID()
  const traceId = init?.trace_id ?? extract(init?.headers) ?? generateID()

  const state: State<T> = {
    id: generateID(),
    lifecycle: "created",
    startTime: clock.now(),
    base: {
      request_id: requestId,
      trace_id: traceId,
      timestamp: new Date().toISOString(),
      service: config.service,
      version: config.version,
      region: config.region,
      deployment_id: config.deployment_id,
      environment: config.environment,
    },
    context: {},
    timers: new Map(),
    timings: new Map(),
    errors: [],
    meta: new Map(),
  }

  return { state, clock }
}

export { create }
