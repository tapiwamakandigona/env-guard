/**
 * env-guard - Validate environment variables at startup
 */

interface Rule {
  required?: boolean;
  default?: string;
  pattern?: RegExp;
  oneOf?: string[];
  transform?: (v: string) => string;
}

type Schema = Record<string, Rule | boolean>;

interface ValidationError {
  key: string;
  message: string;
}

export function guard(schema: Schema): Record<string, string> {
  const errors: ValidationError[] = [];
  const result: Record<string, string> = {};

  for (const [key, rule] of Object.entries(schema)) {
    const value = process.env[key];
    const opts: Rule = typeof rule === "boolean" ? { required: rule } : rule;

    if (!value && opts.default) {
      result[key] = opts.default;
      continue;
    }

    if (!value && opts.required !== false) {
      errors.push({ key, message: `Missing required env var: ${key}` });
      continue;
    }

    if (!value) continue;

    if (opts.pattern && !opts.pattern.test(value)) {
      errors.push({ key, message: `${key} does not match pattern ${opts.pattern}` });
      continue;
    }

    if (opts.oneOf && !opts.oneOf.includes(value)) {
      errors.push({ key, message: `${key} must be one of: ${opts.oneOf.join(", ")}` });
      continue;
    }

    result[key] = opts.transform ? opts.transform(value) : value;
  }

  if (errors.length > 0) {
    console.error("Environment validation failed:");
    errors.forEach(e => console.error(`  - ${e.message}`));
    process.exit(1);
  }

  return result;
}

export default guard;
