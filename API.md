# API Reference

## `guard(schema)`

Validates environment variables against a schema and returns the validated values.

### Parameters

- `schema` - `Record<string, Rule | boolean>` - Object mapping env var names to validation rules

### Returns

- `Record<string, string>` - Object with validated environment variable values

### Throws

Calls `process.exit(1)` with descriptive error messages if validation fails.

---

## Rule Types

### Boolean shorthand

```typescript
guard({ API_KEY: true })  // required
guard({ DEBUG: false })   // not validated
```

### Object rule

```typescript
guard({
  PORT: {
    required: false,     // optional (default: true)
    default: "3000",     // fallback value
    pattern: /^\d+$/,    // must match regex
    oneOf: ["3000", "8080"], // must be one of these
    transform: (v) => v.trim(), // transform before returning
  }
})
```

---

## Error Output

When validation fails, env-guard prints clear errors and exits:

```
Environment validation failed:
  - Missing required env var: DATABASE_URL
  - API_KEY does not match pattern /^sk_/
  - NODE_ENV must be one of: development, production
```

---

## Usage Patterns

### Express.js app

```typescript
import guard from "env-guard";

const env = guard({
  PORT: { default: "3000", pattern: /^\d+$/ },
  DATABASE_URL: true,
  NODE_ENV: { default: "development", oneOf: ["development", "production"] },
  SESSION_SECRET: { pattern: /^.{16,}$/ },
});

app.listen(parseInt(env.PORT));
```

### Next.js

```typescript
// lib/env.ts
import guard from "env-guard";

export const env = guard({
  NEXT_PUBLIC_API_URL: true,
  DATABASE_URL: true,
  NEXTAUTH_SECRET: { pattern: /^.{32,}$/ },
  NEXTAUTH_URL: { default: "http://localhost:3000" },
});
```
