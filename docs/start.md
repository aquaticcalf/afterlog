# Getting started

afterlog orchestrates the logging lifecycle. It handles event construction, context accumulation, sampling, and dispatch. You provide the adapter that actually sends logs somewhere.

Think of it as the conductor, not the orchestra.

## Basic setup

Configure afterlog once when your app starts. Here we use the built-in console adapter for development:

```typescript
import { afterlog, createConsoleAdapter } from "afterlog"

afterlog.configure({
  adapter: createConsoleAdapter()
})
```

For production, write your own adapter to send logs wherever they need to go.

Now you can create builders anywhere:

```typescript
async function handleRequest(req) {
  const builder = afterlog.createBuilder({
    http_method: req.method,
    path: req.path
  })

  try {
    const user = await getUser(req.userId)
    builder.set("user_id", user.id)
    return user
  } finally {
    await afterlog.finalize(builder)
  }
}
```

## Adding context

Use `set()` for simple values:

```typescript
builder.set("customer_tier", "enterprise")
builder.set("request_bytes", 2048)
```

Use `merge()` for nested objects:

```typescript
builder.merge("metadata", { region: "us-east-1" })
builder.merge("metadata", { zone: "a" })
// metadata is now { region: "us-east-1", zone: "a" }
```

## Timing things

The `timing()` method wraps async functions and records how long they took:

```typescript
const result = await builder.timing("database", async () => {
  return await db.query("SELECT * FROM users")
})
```

Or manually mark start and end:

```typescript
builder.time("external_api")
const response = await fetch("https://api.example.com")
builder.timeEnd("external_api")
```

Both approaches add entries to the `timings` field in the final output.

## Handling errors

Call `error()` when something goes wrong:

```typescript
try {
  await riskyOperation()
} catch (err) {
  builder.error(err, { component: "payment" })
}
```

The error gets normalized into a standard format with message, stack trace, and any context you provide.

## What gets emitted

When you call `finalize()`, afterlog produces something like this:

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "trace_id": "trace-abc123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "http_method": "GET",
  "path": "/users/123",
  "user_id": "123",
  "customer_tier": "enterprise",
  "request_duration_ms": 145,
  "timings": {
    "database": 89,
    "external_api": 32
  },
  "metadata": {
    "region": "us-east-1",
    "zone": "a"
  }
}
```

Every event has a `request_id` (unique to this request) and `trace_id` (shared across distributed requests).

## Sampling

By default, afterlog samples at 5%. You probably don't need every single request logged in production.

Configure sampling rules to keep important events:

```typescript
import { errorRule, createLatencyRule } from "afterlog"

afterlog.configure({
  adapter: myAdapter,
  sampling: {
    rules: [
      errorRule,                                    // Always keep errors
      createLatencyRule({ threshold_ms: 1000, sample_rate: 1.0 }),  // Always keep slow requests
    ],
    default_rate: 0.05   // 5% of everything else
  }
})
```

The sampling decision happens at the end of the request when we have all the data.

## Adapters

The adapter is the one thing afterlog does not provide. It is your code that decides where logs go.

afterlog orchestrates everything else: the builder, the sampling, the lifecycle. The adapter is your hook into the transport layer.

For local development, use the console adapter:

```typescript
import { createConsoleAdapter } from "afterlog"

const adapter = createConsoleAdapter({ format: "json" })
```

For everything else, write your own. It is one function:

```typescript
const myAdapter = {
  emit: async (event) => {
    await sendToDatadog(event)
  }
}
```

## Next steps

See the [API reference](./api.md) for all methods and options, or check out [examples](./examples.md) for common patterns.
