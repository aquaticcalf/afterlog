import type { UUID } from "@/utils/id"
import type { BaseWideEvent } from "@/core/types/wideevent/base"
import type { Clock, Config, Init } from "@/core/types/config"
import type { Lifecycle } from "@/core/builder/lifecycle"
import type { State, Finalized } from "@/core/builder/state"
import { assert } from "@/core/builder/assert"
import { create } from "@/core/builder/create"
import { snapshot as snap } from "@/core/builder/inspect"
import {
  set,
  merge,
  enrich,
  timing,
  time,
  timeend,
  capture,
  hasErrors,
  finalize,
} from "@/core/builder/methods"
import { extract } from "@/core/builder/trace"

/**
 * builder for accumulating context and creating wide events.
 */
class Builder<T extends BaseWideEvent> {
  private state: State<T>
  private clock: Clock
  private config: Config<T>
  private dirty = false
  private cachedSnapshot: Partial<T> | null = null

  constructor(config: Config<T>, init?: Init) {
    this.config = config
    const c = create<T>(config, init)
    this.state = c.state
    this.clock = c.clock
  }

  private check(...allowed: Lifecycle[]): void {
    assert(this.state, ...allowed)
  }
  set<K extends keyof T>(key: K, value: T[K]): this {
    this.check("created", "building")
    this.dirty = set(this.state, key, value).dirty
    return this
  }
  merge<K extends keyof T>(key: K, value: unknown): this {
    this.check("created", "building")
    this.dirty = merge(this.state, key, value).dirty
    return this
  }
  enrich(key: string, value: unknown): this {
    this.check("created", "building")
    this.dirty = enrich(this.state, key, value).dirty
    return this
  }
  async timing<R>(name: string, fn: () => R | Promise<R>): Promise<R> {
    this.check("created", "building")
    const r = await timing(this.state, this.clock, name, fn)
    this.dirty = r.dirty
    return r.result
  }
  time(name: string): void {
    this.check("created", "building")
    time(this.state, this.clock, name)
  }
  timeEnd(name: string): number {
    this.check("created", "building")
    const r = timeend(this.state, this.clock, name)
    this.dirty = r.dirty
    return r.duration
  }
  error(err: unknown, context?: Record<string, unknown>): this {
    this.check("created", "building")
    this.dirty = capture(this.state, err, context).dirty
    return this
  }
  hasErrors(): boolean {
    return hasErrors(this.state)
  }
  snapshot_(): Readonly<Partial<T>> {
    const r = snap(this.state, this.dirty, this.cachedSnapshot)
    this.dirty = r.dirty
    this.cachedSnapshot = r.cached
    return r.snapshot as Readonly<Partial<T>>
  }
  finalize(): Finalized<T> {
    this.check("created", "building")
    return finalize(this.state, this.clock, this.config)
  }
  get state_(): Lifecycle {
    return this.state.lifecycle
  }
  get id(): UUID {
    return this.state.id
  }
}

export { Builder, extract as extractTraceId }
