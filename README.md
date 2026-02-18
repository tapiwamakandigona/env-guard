# env-guard

[![CI](https://github.com/tapiwamakandigona/env-guard/actions/workflows/ci.yml/badge.svg)](https://github.com/tapiwamakandigona/env-guard/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> Validate environment variables at startup. Never deploy with missing config again.

## Why?

Your app crashes at 3am because someone forgot to set `DATABASE_URL`. env-guard catches missing or invalid env vars **before** your app starts, with clear error messages.

## Install

```bash
npm install env-guard
```

## Quick Start

```typescript
import guard from "env-guard";

const env = guard({
  DATABASE_URL: true,                              // required
  PORT: { default: "3000" },                       // optional with default
  NODE_ENV: { oneOf: ["development", "production"] },  // enum
  API_KEY: { pattern: /^sk_/ },                    // regex validation
  LOG_LEVEL: { required: false },                  // optional
});

// env.DATABASE_URL is guaranteed to exist
// env.PORT is "3000" if not set
// If anything is wrong, process exits with clear errors
```

## Output on Failure

```
Environment validation failed:
  - Missing required env var: DATABASE_URL
  - API_KEY does not match pattern /^sk_/
  - NODE_ENV must be one of: development, production
```

## API

```typescript
guard(schema: Record<string, Rule | boolean>): Record<string, string>
```

### Rule Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `required` | `boolean` | `true` | Whether the var must be set |
| `default` | `string` | - | Fallback value if not set |
| `pattern` | `RegExp` | - | Regex the value must match |
| `oneOf` | `string[]` | - | Whitelist of allowed values |
| `transform` | `(v: string) => string` | - | Transform before returning |

### Shorthand

```typescript
// These are equivalent:
guard({ API_KEY: true })
guard({ API_KEY: { required: true } })
```

## Real-World Example

```typescript
import guard from "env-guard";

const env = guard({
  // Database
  DATABASE_URL: true,
  DATABASE_POOL_SIZE: { default: "10", pattern: /^\d+$/ },
  
  // Auth
  JWT_SECRET: { pattern: /^.{32,}$/ },  // at least 32 chars
  
  // API
  PORT: { default: "3000" },
  NODE_ENV: { oneOf: ["development", "staging", "production"] },
  LOG_LEVEL: { required: false, oneOf: ["debug", "info", "warn", "error"] },
  
  // External services
  STRIPE_KEY: { pattern: /^sk_(test|live)_/ },
  SENDGRID_KEY: { required: false },
});
```

## Zero Dependencies

env-guard has **zero runtime dependencies**. It's a single file that validates `process.env`.

## TypeScript

Full TypeScript support with type inference.

## License

MIT
