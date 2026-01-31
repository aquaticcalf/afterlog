# afterlog

The orchestration layer for structured logging in TypeScript.

afterlog coordinates the lifecycle of log events: building context, sampling decisions, timing measurements, error normalization, and dispatch. You bring the adapter that sends logs to your destination. We handle the orchestration, you handle the transport.

## What it does

Most logging libraries emit a line every time you call `console.log()`. This works until you need to understand what happened during a single HTTP request that touched six different services.

afterlog takes a different approach. You create a `Builder` at the start of a request, add data as the request progresses, and emit one comprehensive log entry at the end.

```typescript
import { afterlog } from "afterlog"

const builder = afterlog.createBuilder({
  http_method: "GET",
  path: "/users/123"
})

// Add fields anytime
builder.set("user_id", "123")

// Time operations automatically
const user = await builder.timing("database", () => db.getUser("123"))

// Emit at the end
await afterlog.finalize(builder)
```

The result is a single JSON object with `request_id`, `trace_id`, timestamps, custom fields, and timing breakdowns.

## Why use this?

- Query across related data easily since it is all in one record
- One write per request instead of dozens
- Works well with tracing systems
- Built-in sampling so you do not drown in logs

## Quick links

- [Getting started](./docs/start.md)
- [API reference](./docs/api.md)
- [Examples](./docs/examples.md)

## Install

```bash
npm install afterlog
```

## License

MIT
