# Reflo

Redis-backed rate limiter middleware for Express applications using token bucket algorithm.

## Installation

```bash
npm install reflo
```

## Quick Start

```typescript
import express from 'express';
import { rateLimiter } from 'reflo';

const app = express();

app.use(rateLimiter({
  timeWindowSeconds: 60,
  requestCount: 100,
}));

app.listen(3000);
```

## Configuration

```typescript
interface LimiterConfig {
  timeWindowSeconds: number;
  requestCount: number;
  exceptions?: Array<{ route: string; count: number }>;
  allowlist?: string[];
  blocklist?: string[];
  getIdentifier?: (req: Request) => string;
  backoffStrategy?: (overuse: number) => number;
}
```

| Option | Type | Description |
|--------|------|-------------|
| `timeWindowSeconds` | `number` | Rate limit window in seconds |
| `requestCount` | `number` | Maximum requests per window |
| `exceptions` | `Array<{route, count}>` | Per-route limit overrides |
| `allowlist` | `string[]` | Bypass rate limiting |
| `blocklist` | `string[]` | Always blocked |
| `getIdentifier` | `(req) => string` | User identification function |
| `backoffStrategy` | `(overuse) => number` | Delay calculation function |

## Strategies

### Identifier Strategies

```typescript
import { identifierStrategies } from 'reflo';

// By IP address
identifierStrategies.byIP()

// By header value
identifierStrategies.byHeader('x-api-key')
```

### Backoff Strategies

```typescript
import { backoffStrategies } from 'reflo';

backoffStrategies.none()                    // No delay
backoffStrategies.fixed(500)                // Fixed 500ms delay
backoffStrategies.linear(100, 5000)         // Linear: 100ms * overuse, max 5s
backoffStrategies.exponential(200, 10000)   // Exponential: 200ms * 2^overuse, max 10s
```

## Advanced Usage

### Per-Route Limits

```typescript
app.use(rateLimiter({
  timeWindowSeconds: 60,
  requestCount: 100,
  exceptions: [
    { route: '/api/upload', count: 5 },
    { route: '/api/search', count: 500 },
  ],
}));
```

### Allow/Block Lists

```typescript
app.use(rateLimiter({
  timeWindowSeconds: 60,
  requestCount: 100,
  allowlist: ['ip:127.0.0.1', 'hdr:x-api-key:admin-key'],
  blocklist: ['ip:192.168.1.100'],
}));
```

### Custom Strategies

```typescript
const customIdentifier = (req) => `user:${req.user?.id || req.ip}`;
const customBackoff = (overuse) => Math.min(1000, 50 * Math.pow(overuse, 1.5));

app.use(rateLimiter({
  timeWindowSeconds: 60,
  requestCount: 100,
  getIdentifier: customIdentifier,
  backoffStrategy: customBackoff,
}));
```

## Environment Variables

```bash
REDIS_URL=redis://localhost:6379
REDIS_TLS=true  # Enable TLS connection
```

## Response Headers

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window

## Requirements

- Node.js 14+
- Redis server
- Express application

## License

MIT
