# API Reference

## afterlog singleton

The main entry point. Configure once, use throughout your app.

### configure(config)

Sets up the global instance. Must be called before using other methods.

```typescript
afterlog.configure({
  adapter: myAdapter,
  service: "user-api",
  version: "1.2.3"
})
```

Options:

- `adapter` (required) - Where to send events. A `LoggerAdapter` or adapter config.
- `sampling` - Sampling configuration with `rules` array and `default_rate`
- `service`, `version`, `region`, `deployment_id`, `environment` - Added to every event
- `enrichers` - Functions that add data at finalize time
- `buffer` - Buffer settings: `max_size`, `flush_interval_ms`

### createBuilder(init)

Creates a new Builder for a request.

```typescript
const builder = afterlog.createBuilder({
  http_method: "GET",
  path: "/api/users"
})
```

The `init` object can include any fields you want in the final event. Common ones are `http_method`, `path`, `trace_id`.

### finalize(builder)

Finalizes the builder and emits the event if sampled.

```typescript
const emitted = await afterlog.finalize(builder)
// emitted is true if the event was sent to the adapter
```

Returns a promise that resolves to boolean. Always call this, even if you don't use the return value.

### flush()

Flushes any buffered events. Use this during graceful shutdown.

```typescript
await afterlog.flush()
```

### destroy()

Cleans up resources.

```typescript
await afterlog.destroy()
```

### isHealthy()

Checks if adapters are working.

```typescript
const healthy = afterlog.isHealthy()
```

Returns boolean.

### getMetrics()

Gets adapter metrics.

```typescript
const metrics = afterlog.getMetrics()
// { eventsEmitted: 1000, eventsFailed: 2, ... }
```

## Builder

Created by `afterlog.createBuilder()`. Accumulates data throughout a request.

### set(key, value)

Sets a field on the event.

```typescript
builder.set("user_id", "123")
builder.set("order_total", 99.99)
```

Overwrites any existing value.

### merge(key, value)

Deep merges into a nested object.

```typescript
builder.merge("metadata", { source: "web" })
builder.merge("metadata", { campaign: "summer_sale" })
// metadata ends up as { source: "web", campaign: "summer_sale" }
```

### enrich(key, value)

Adds enrichment data. Similar to merge but for data that gets added at finalize time.

```typescript
builder.enrich("computed", { expensive_field: calculateValue() })
```

### time(name)

Marks the start of a timing.

```typescript
builder.time("database")
```

### timeEnd(name)

Marks the end of a timing.

```typescript
builder.timeEnd("database")
```

Throws if you call timeEnd without a matching time.

### timing(name, fn)

Times an async function automatically.

```typescript
const result = await builder.timing("api_call", async () => {
  return await fetch("/api/data")
})
```

If the function throws, the error is still recorded in timings with a `failed: true` flag, then re-thrown.

### error(err, context?)

Records an error.

```typescript
builder.error(new Error("Database timeout"))
builder.error(err, { component: "payment", retry_count: 3 })
```

Normalizes errors into a standard format with message, stack, type, and context.

### finalize()

Finalizes the builder locally. Usually you call `afterlog.finalize(builder)` instead.

```typescript
const finalized = builder.finalize()
```

Returns a `Finalized` object with all the collected data.

## Sampling

### errorRule

A built-in rule that always samples events containing errors.

```typescript
import { errorRule } from "afterlog"

afterlog.configure({
  sampling: {
    rules: [errorRule]
  }
})
```

### createLatencyRule(config)

Creates a rule based on request duration.

```typescript
const rule = createLatencyRule({
  threshold_ms: 1000,
  sample_rate: 1.0,      // Sample 100% of slow requests
  priority: 10
})
```

### createRandomRule(rate, priority?)

Random sampling at a fixed rate.

```typescript
const rule = createRandomRule(0.01, 100)  // 1% sample
```

### createConsistentRule(config)

Consistent sampling based on trace_id. Same trace_id always gets the same decision.

```typescript
const rule = createConsistentRule({
  sample_rate: 0.1,
  priority: 50
})
```

### Custom rules

Implement the `SamplingRule` interface:

```typescript
const myRule: SamplingRule = {
  name: "vip_users",
  priority: 5,
  evaluate: (event) => {
    if (event.user_tier === "vip") {
      return { sampled: true, rate: 1.0, reason: "vip_user" }
    }
  }
}
```

Rules are evaluated in priority order (lowest number first). The first rule that returns a decision wins.

## Adapters

### createConsoleAdapter(options?)

Built-in adapter that logs to console.

```typescript
const adapter = createConsoleAdapter({
  format: "json"  // or "pretty"
})
```

### LoggerAdapter interface

Implement this to send logs elsewhere:

```typescript
interface LoggerAdapter {
  emit(event: WideEvent): Promise<void> | void;
  flush?(): Promise<void> | void;
  destroy?(): Promise<void> | void;
  isHealthy?(): boolean;
}
```

Only `emit` is required.

### AdapterManager

Wraps adapters with metrics and hooks. Usually you don't interact with this directly.

## Types

Export these types from the main package:

```typescript
import type {
  WideEvent,
  BaseWideEvent,
  HttpWideEvent,
  SamplingDecision,
  SamplingRule,
  SamplingConfig,
  LoggerAdapter,
  AdapterMetrics,
  SingletonConfig,
  Builder,
  Finalized,
  State,
  TimingStats,
  NormalizedError,
  Lifecycle
} from "afterlog"
```
