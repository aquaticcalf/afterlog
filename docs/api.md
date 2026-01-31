# API Reference

## afterlog

### configure(config)

Sets up the global instance. Call once at startup.

```typescript
afterlog.configure({
  adapter: myAdapter,
  service: "user-api",
  version: "1.2.3",
  sampling: {
    rules: [errorRule],
    default_rate: 0.05
  }
})
```

**Options:**

- `adapter` (required) - Object with `emit(event)` method
- `service`, `version`, `region`, `deployment_id`, `environment` - Added to every event
- `sampling.rules` - Array of sampling rules
- `sampling.default_rate` - Number 0-1, defaults to 0.05
- `enrichers` - Functions that add data at finalize time
- `buffer.max_size` - Max events to buffer
- `buffer.flush_interval_ms` - Flush interval

### createBuilder(init)

Creates a builder for a request.

```typescript
const builder = afterlog.createBuilder({
  http_method: "GET",
  path: "/api/users",
  trace_id: "a12b34cd-5678-40ef-abcd-1234567890ab"
})
```

The `init` object becomes fields in the final event.

### finalize(builder)

Finalizes builder and emits if sampled.

```typescript
const emitted = await afterlog.finalize(builder)
// returns true if event was sent to adapter
```

Always call this, even if you don't check the return value.

### flush()

Flushes buffered events. Use during shutdown.

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
const healthy = await afterlog.isHealthy() // boolean
```

### getMetrics()

Returns adapter metrics.

```typescript
const metrics = afterlog.getMetrics()
// { eventsEmitted: 1000, eventsFailed: 2, bytesEmitted: 50000 }
```

## Builder

Created by `afterlog.createBuilder()`. Accumulates data during a request.

### set(key, value)

Sets a field. Overwrites existing.

```typescript
builder.set("user_id", "123")
builder.set("amount", 99.99)
```

### merge(key, value)

Deep merges into a nested object.

```typescript
builder.merge("metadata", { region: "us-east" })
builder.merge("metadata", { zone: "a" })
// metadata: { region: "us-east", zone: "a" }
```

### enrich(key, value)

Adds data at finalize time. Useful for expensive computations.

```typescript
builder.enrich("computed", { expensive_field: calculate() })
```

### time(name)

Starts a timer.

```typescript
builder.time("database")
```

### timeEnd(name)

Ends a timer. Throws if no matching `time()`.

```typescript
builder.timeEnd("database")
```

### timing(name, fn)

Times an async function.

```typescript
const result = await builder.timing("api", async () => {
  return await fetch("/api/data")
})
```

If the function throws, records `{ failed: true }` in timings and re-throws.

### error(err, context?)

Records an error with optional context.

```typescript
builder.error(new Error("Failed"))
builder.error(err, { component: "payment", retry: 3 })
```

Errors are normalized with: `message`, `stack`, `type`, `context`

### finalize()

Finalizes locally. Usually call `afterlog.finalize(builder)` instead.

```typescript
const finalized = builder.finalize()
```

Returns a `Finalized` object with all data.

## Sampling Rules

### errorRule

Always samples events with errors.

```typescript
import { errorRule } from "afterlog"

afterlog.configure({
  sampling: { rules: [errorRule] }
})
```

### createLatencyRule(config)

Samples based on request duration.

```typescript
const rule = createLatencyRule({
  threshold_ms: 1000,  // Requests slower than this
  sample_rate: 1.0,    // Get sampled at this rate
  priority: 10         // Lower = evaluated first
})
```

### createRandomRule(rate, priority?)

Random sampling.

```typescript
const rule = createRandomRule(0.01, 100) // 1% sample
```

### createConsistentRule(config)

Consistent sampling based on trace_id.

```typescript
const rule = createConsistentRule({
  sample_rate: 0.1,
  priority: 50
})
```

Same trace_id always gets same decision.

### Custom Rules

```typescript
const rule: SamplingRule = {
  name: "vip_users",
  priority: 5,
  evaluate: (event) => {
    if (event.user_tier === "vip") {
      return { sampled: true, rate: 1.0, reason: "vip" }
    }
    // Return undefined to try next rule
  }
}
```

Rules are evaluated by priority (lowest first). First rule with a result wins.

## Adapters

### createConsoleAdapter(options?)

Built-in adapter for development.

```typescript
const adapter = createConsoleAdapter({
  pretty: false,  // default: single line json
  method: "log",  // console method to use
  includeTimestamp: false
})
```

### LoggerAdapter Interface

```typescript
interface LoggerAdapter {
  emit(event: WideEvent): Promise<void> | void
  flush?(): Promise<void> | void
  destroy?(): Promise<void> | void
  isHealthy?(): boolean
}
```

Only `emit` is required.

Example:

```typescript
const datadogAdapter = {
  emit: async (event) => {
    await fetch("https://logs.datadoghq.com/v1/input", {
      method: "POST",
      headers: { "DD-API-KEY": key },
      body: JSON.stringify(event)
    })
  }
}
```

## Types

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

## WideEvent Structure

```typescript
interface WideEvent {
  // Core fields
  request_id: string        // UUID
  trace_id: string          // Distributed tracing ID
  timestamp: string         // ISO 8601
  
  // Service metadata
  service?: string
  version?: string
  region?: string
  
  // HTTP fields (if provided)
  http_method?: string
  path?: string
  http_status_code?: number
  request_duration_ms?: number
  
  // Data
  timings?: Record<string, number>
  error?: NormalizedError
  
  // Custom fields
  [key: string]: any
}
```

## NormalizedError Structure

```typescript
interface NormalizedError {
  message: string
  stack?: string
  type?: string
  context?: Record<string, any>
}
```
