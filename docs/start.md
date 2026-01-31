# Getting Started

## Installation

<details open>
<summary>bun</summary>

```bash
bun add afterlog
```
</details>

<details>
<summary>npm</summary>

```bash
npm install afterlog
```
</details>

<details>
<summary>yarn</summary>

```bash
yarn add afterlog
```
</details>

<details>
<summary>pnpm</summary>

```bash
pnpm add afterlog
```
</details>

## Basic Setup

```typescript
import { afterlog, createConsoleAdapter } from "afterlog"

afterlog.configure({
  adapter: createConsoleAdapter()
})
```

The console adapter prints JSON to stdout. For production, write your own adapter (see examples).

## Your First Log

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

Output:
```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "trace_id": "trace-abc123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "http_method": "GET",
  "path": "/users/123",
  "user_id": "456"
}
```

## Adding Data

```typescript
// Simple values
builder.set("customer_tier", "enterprise")
builder.set("response_bytes", 2048)

// Nested objects (deep merge)
builder.merge("metadata", { region: "us-east-1" })
builder.merge("metadata", { zone: "a" })
// Result: { region: "us-east-1", zone: "a" }
```

## Timing Operations

```typescript
// Automatic timing
const user = await builder.timing("database", () => db.getUser(id))

// Manual timing
builder.time("external_api")
const result = await fetch("https://api.example.com")
builder.timeEnd("external_api")
```

Output includes:
```json
{
  "timings": {
    "database": 45,
    "external_api": 120
  }
}
```

## Error Handling

```typescript
try {
  await riskyOperation()
} catch (err) {
  builder.error(err, { component: "payment" })
}
```

Errors are normalized with message, stack trace, type, and your context.

## Sampling

Don't log everything. Sample based on rules:

```typescript
import { errorRule, createLatencyRule } from "afterlog"

afterlog.configure({
  adapter: myAdapter,
  sampling: {
    rules: [
      errorRule,  // Always log errors
      createLatencyRule({ threshold_ms: 1000, sample_rate: 1.0 })  // Log slow requests
    ],
    default_rate: 0.05  // 5% of everything else
  }
})
```

## Writing Adapters

The adapter sends logs to your destination:

```typescript
const myAdapter = {
  emit: async (event) => {
    // Send to Datadog, CloudWatch, Splunk, etc.
    await fetch("https://logs.example.com", {
      method: "POST",
      body: JSON.stringify(event)
    })
  },
  
  // Optional lifecycle methods
  flush: async () => { /* flush buffered logs */ },
  isHealthy: () => true
}

afterlog.configure({ adapter: myAdapter })
```

## Next Steps

- [Examples](./examples.md) - Express, error handling, testing
- [API Reference](./api.md) - Complete method list
