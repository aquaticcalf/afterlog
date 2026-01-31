# Examples

## Express middleware

Add afterlog to every request:

```typescript
import { afterlog } from 'afterlog';

function loggingMiddleware() {
  return (req, res, next) => {
    const builder = afterlog.createBuilder({
      http_method: req.method,
      path: req.path,
      http_host: req.hostname
    });

    // Attach to request for handlers to use
    req.log = builder;

    const start = Date.now();

    res.on('finish', () => {
      builder.set('http_status_code', res.statusCode);
      builder.set('request_duration_ms', Date.now() - start);
      afterlog.finalize(builder);
    });

    next();
  };
}

// Use it
app.use(loggingMiddleware());

// In route handlers
app.get('/users/:id', async (req, res) => {
  const user = await req.log.timing('db', () => db.getUser(req.params.id));
  req.log.set('user_id', user.id);
  res.json(user);
});
```

## Error handling

Capture errors properly:

```typescript
async function processPayment(orderId) {
  const builder = afterlog.createBuilder({
    order_id: orderId
  });

  try {
    const payment = await builder.timing('stripe', () => 
      stripe.charges.create({ ... })
    );
    builder.set('payment_id', payment.id);
    return payment;
  } catch (err) {
    builder.error(err, { 
      component: 'payment',
      order_id: orderId 
    });
    throw err;
  } finally {
    await afterlog.finalize(builder);
  }
}
```

## Distributed tracing

Pass trace_id through your services:

```typescript
// Service A
async function handleRequest(req) {
  const traceId = req.headers['x-trace-id'] || generateId();
  
  const builder = afterlog.createBuilder({
    trace_id: traceId,
    http_method: req.method,
    path: req.path
  });

  // Call service B with the same trace_id
  await callServiceB(traceId, data);

  await afterlog.finalize(builder);
}

// Service B
async function callServiceB(traceId, data) {
  const builder = afterlog.createBuilder({
    trace_id: traceId,  // Same trace
    http_method: 'POST',
    path: '/service-b'
  });

  await fetch('http://service-b/api', {
    headers: { 'X-Trace-Id': traceId }
  });

  await afterlog.finalize(builder);
}
```

Now you can search by trace_id and see the whole request flow.

## Custom adapter for Datadog

Send logs to Datadog:

```typescript
import { afterlog } from 'afterlog';

const datadogAdapter = {
  emit: async (event) => {
    await fetch('https://http-intake.logs.datadoghq.com/v1/input', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': process.env.DD_API_KEY
      },
      body: JSON.stringify({
        ...event,
        ddsource: 'nodejs',
        service: process.env.SERVICE_NAME
      })
    });
  }
};

afterlog.configure({
  adapter: datadogAdapter
});
```

## Environment-based configuration

Different settings for dev/staging/prod:

```typescript
import { afterlog, createConsoleAdapter } from 'afterlog';

const env = process.env.NODE_ENV;
const isProd = env === 'production';

afterlog.configure({
  adapter: isProd 
    ? datadogAdapter 
    : createConsoleAdapter({ format: env === 'development' ? 'pretty' : 'json' }),
  
  service: process.env.SERVICE_NAME,
  version: process.env.SERVICE_VERSION,
  
  sampling: {
    default_rate: isProd ? 0.05 : 1.0  // Sample everything in dev, 5% in prod
  }
});
```

## Health checks

Check if logging is working:

```typescript
// In your health check endpoint
app.get('/health', (req, res) => {
  const healthy = afterlog.isHealthy();
  
  if (!healthy) {
    return res.status(503).json({ 
      status: 'unhealthy',
      logging: 'down' 
    });
  }

  const metrics = afterlog.getMetrics();
  
  res.json({
    status: 'healthy',
    logging: {
      eventsEmitted: metrics.eventsEmitted,
      eventsFailed: metrics.eventsFailed
    }
  });
});
```

## Graceful shutdown

Flush logs before exiting:

```typescript
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  
  // Stop accepting new requests
  server.close();
  
  // Flush pending logs
  await afterlog.flush();
  await afterlog.destroy();
  
  process.exit(0);
});
```

## Testing

Mock afterlog in tests:

```typescript
import { afterlog } from 'afterlog';

// In your test setup
const emittedEvents = [];

beforeEach(() => {
  afterlog.configure({
    adapter: {
      emit: (event) => {
        emittedEvents.push(event);
      }
    },
    sampling: { default_rate: 1.0 }  // Sample everything
  });
});

// In your test
it('should log user access', async () => {
  await handleRequest({ userId: '123' });
  
  expect(emittedEvents).toHaveLength(1);
  expect(emittedEvents[0].user_id).toBe('123');
});
```

## Complex timing breakdown

Track multiple operations:

```typescript
async function complexOperation() {
  const builder = afterlog.createBuilder({
    operation: 'generate_report'
  });

  // Time each step
  const users = await builder.timing('fetch_users', () => getUsers());
  const orders = await builder.timing('fetch_orders', () => getOrders());
  
  // Run operations in parallel and time them
  const [analytics, exports] = await Promise.all([
    builder.timing('analytics', () => runAnalytics(users, orders)),
    builder.timing('export', () => generateExport(users, orders))
  ]);

  builder.set('report_size_bytes', exports.length);
  
  await afterlog.finalize(builder);
  
  return exports;
}
```

The resulting log will have:

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
