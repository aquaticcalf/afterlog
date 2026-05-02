# afterlog

Structured logging for TypeScript. One JSON object per request.

```typescript
import { afterlog } from "afterlog"

const builder = afterlog.createBuilder({
  http_method: "GET",
  path: "/users/123",
})

builder.set("user_id", "123")

const user = await builder.timing("database", () => db.getUser("123"))

await afterlog.finalize(builder)
// {"request_id":"550e8400-...","trace_id":"a12b34cd-5678-40ef-abcd-...","http_method":"GET",...}
```

## Install

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

## Quick Start

Configure once:

```typescript
import { afterlog, createConsoleAdapter } from "afterlog"

afterlog.configure({
  adapter: createConsoleAdapter(),
})
```

Use in your routes:

```typescript
app.get("/users/:id", async (req, res) => {
  const builder = afterlog.createBuilder({
    http_method: req.method,
    path: req.path,
  })

  const user = await builder.timing("db", () => db.getUser(req.params.id))
  builder.set("user_id", user.id)

  await afterlog.finalize(builder)
  res.json(user)
})
```

## What You Get

One JSON object per request with:

- `request_id` - UUID unique per request
- `trace_id` - UUID shared across services (auto-generated if not provided)
- `timings` - how long each operation took
- `error` - normalized error info
- Your custom fields

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "trace_id": "a12b34cd-5678-40ef-abcd-1234567890ab",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "http_method": "GET",
  "path": "/users/123",
  "user_id": "123",
  "timings": {
    "db": 45,
    "cache": 5
  }
}
```

## Why Wide Events?

Traditional logging:

```
[10:30:00] GET /users/123
[10:30:00] Database query: SELECT * FROM users WHERE id=123
[10:30:01] Cache miss
[10:30:02] Response: 200
```

Wide event logging:

```json
{ "http_method": "GET", "path": "/users/123", "timings": { "db": 1000, "cache": 50 } }
```

- Query by any field
- One write per request
- Works with tracing

## Documentation

- [Getting Started](./docs/start.md) - Setup and basic usage
- [Examples](./docs/examples.md) - Common patterns
- [API Reference](./docs/api.md) - All methods and types

## Adapters

afterlog doesn't send logs anywhere by default. You write the adapter:

```typescript
const datadogAdapter = {
  emit: async (event) => {
    await fetch("https://http-intake.logs.datadoghq.com/v1/input", {
      method: "POST",
      headers: { "DD-API-KEY": process.env.DD_API_KEY },
      body: JSON.stringify(event),
    })
  },
}

afterlog.configure({ adapter: datadogAdapter })
```

Or use the built-in console adapter for development.

## Sampling

Don't log everything. Sample by error, latency, or random:

```typescript
import { errorRule, createLatencyRule } from "afterlog"

afterlog.configure({
  adapter: myAdapter,
  sampling: {
    rules: [
      errorRule, // Always log errors
      createLatencyRule({ threshold_ms: 1000, sample_rate: 1.0 }), // Always log slow requests
    ],
    default_rate: 0.05, // 5% of the rest
  },
})
```

## License

MIT
