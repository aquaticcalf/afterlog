# Examples

## Writing an Adapter

Simple console adapter:

```typescript
const consoleAdapter = {
  emit: async (event) => {
    console.log(JSON.stringify(event))
  }
}

afterlog.configure({ adapter: consoleAdapter })
```

File adapter with lifecycle methods:

```typescript
const fileAdapter = {
  stream: fs.createWriteStream("/var/log/app.jsonl", { flags: "a" }),
  
  emit: async (event) => {
    this.stream.write(JSON.stringify(event) + "\n")
  },
  
  flush: async () => {
    return new Promise((resolve) => {
      this.stream.end(resolve)
    })
  }
}
```

## Express Middleware

afterlog does not include Express middleware. Write your own:

```typescript
function loggingMiddleware() {
  return (req, res, next) => {
    const builder = afterlog.createBuilder({
      http_method: req.method,
      path: req.path
    })

    req.log = builder
    const start = Date.now()

    res.on("finish", () => {
      builder.set("http_status_code", res.statusCode)
      builder.set("duration_ms", Date.now() - start)
      afterlog.finalize(builder)
    })

    next()
  }
}

app.use(loggingMiddleware())

app.get("/users/:id", async (req, res) => {
  const user = await req.log.timing("db", () => db.getUser(req.params.id))
  req.log.set("user_id", user.id)
  res.json(user)
})
```

## Error Handling

```typescript
async function processPayment(orderId) {
  const builder = afterlog.createBuilder({ order_id: orderId })

  try {
    const payment = await builder.timing("stripe", () => 
      stripe.charges.create({ amount: 1000 })
    )
    builder.set("payment_id", payment.id)
    return payment
  } catch (err) {
    builder.error(err, { component: "payment" })
    throw err
  } finally {
    await afterlog.finalize(builder)
  }
}
```

## Distributed Tracing

**Note:** `trace_id` is automatically generated if you don't provide it.

When a request spans multiple services, use `builder.trace_id` to propagate the trace:

```typescript
// Service A - auto-generates trace_id
async function handleRequest(req) {
  const builder = afterlog.createBuilder({
    http_method: req.method,
    path: req.path
  })

  // Pass builder.trace_id to Service B
  await callServiceB(builder.trace_id)
  await afterlog.finalize(builder)
}

// Service B - uses the same trace_id
async function callServiceB(traceId) {
  const builder = afterlog.createBuilder({
    trace_id: traceId,  // same trace as Service A
    http_method: "POST",
    path: "/service-b"
  })

  await fetch("http://service-b/api", {
    headers: { "X-Trace-Id": traceId }
  })

  await afterlog.finalize(builder)
}
```

Search by `trace_id` to see the full request flow across services.

**For single-service apps:** You don't need to think about trace_id at all. afterlog generates one automatically.

## Datadog Adapter

```typescript
const datadogAdapter = {
  emit: async (event) => {
    await fetch("https://http-intake.logs.datadoghq.com/v1/input", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "DD-API-KEY": process.env.DD_API_KEY
      },
      body: JSON.stringify({
        ...event,
        ddsource: "nodejs",
        service: process.env.SERVICE_NAME
      })
    })
  }
}

afterlog.configure({ adapter: datadogAdapter })
```

## Environment-Based Config

```typescript
const isProd = process.env.NODE_ENV === "production"

afterlog.configure({
  adapter: isProd 
    ? datadogAdapter 
    : createConsoleAdapter({ pretty: env === "development" }),
  
  service: process.env.SERVICE_NAME,
  version: process.env.SERVICE_VERSION,
  
  sampling: {
    default_rate: isProd ? 0.05 : 1.0
  }
})
```

## Health Checks

```typescript
app.get("/health", async (req, res) => {
  const healthy = await afterlog.isHealthy()
  if (!healthy) {
    return res.status(503).json({ status: "unhealthy" })
  }

  const metrics = afterlog.getMetrics()
  res.json({
    status: "healthy",
    events_emitted: metrics.eventsEmitted,
    events_failed: metrics.eventsFailed
  })
})
```

## Graceful Shutdown

```typescript
process.on("SIGTERM", async () => {
  server.close()
  await afterlog.flush()
  await afterlog.destroy()
  process.exit(0)
})
```

## Testing

```typescript
const emittedEvents = []

beforeEach(() => {
  afterlog.configure({
    adapter: {
      emit: (event) => emittedEvents.push(event)
    },
    sampling: { default_rate: 1.0 }
  })
})

it("logs user access", async () => {
  await handleRequest({ userId: "123" })
  
  expect(emittedEvents).toHaveLength(1)
  expect(emittedEvents[0].user_id).toBe("123")
})
```

## Parallel Operations

```typescript
async function generateReport() {
  const builder = afterlog.createBuilder({ operation: "report" })

  const users = await builder.timing("fetch_users", () => getUsers())
  const orders = await builder.timing("fetch_orders", () => getOrders())
  
  const [analytics, exports] = await Promise.all([
    builder.timing("analytics", () => runAnalytics(users, orders)),
    builder.timing("export", () => generateExport(users, orders))
  ])

  builder.set("report_size", exports.length)
  await afterlog.finalize(builder)
  
  return exports
}
```

Output:
```json
{
  "timings": {
    "fetch_users": 45,
    "fetch_orders": 32,
    "analytics": 120,
    "export": 89
  }
}
```
