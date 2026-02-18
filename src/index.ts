/**
 * env-guard - Validate environment variables at startup.
 * 
 * @example
 * ```typescript
 * import guard from "env-guard";
 * const env = guard({
 *   DATABASE_URL: true,
 *   PORT: { default: "3000" },
 *   NODE_ENV: { oneOf: ["development", "production"] },
 * });
 * ```
 * 
 * @module env-guard
 * @version 1.0.0
 * @license MIT
 * @author Tapiwa Makandigona
 */

/** Validation rule for a single environment variable. */
export interface Rule {
  /** Whether the variable is required. Default: true */
  required?: boolean;
  /** Default value if the variable is not set */
  default?: string;
  /** Regular expression the value must match */
  pattern?: RegExp;
  /** List of allowed values */
  oneOf?: string[];
  /** Transform function applied to the value before returning */
  transform?: (value: string) => string;
  /** Human-readable description for error messages */
  description?: string;
}

/** Schema mapping env var names to validation rules or boolean shorthand. */
export type Schema = Record<string, Rule | boolean>;

/** A single validation error with context. */
export interface ValidationError {
  /** The environment variable name */
  key: string;
  /** Human-readable error message */
  message: string;
  /** The rule that failed */
  rule: string;
}

/**
 * Validates environment variables against a schema.
 * Exits the process with code 1 if validation fails.
 * 
 * @param schema - Object mapping env var names to validation rules
 * @returns Object with validated environment variable values
 * 
 * @example
 * ```typescript
 * const env = guard({
 *   API_KEY: true,                              // required
 *   PORT: { default: "3000" },                  // optional with default
 *   NODE_ENV: { oneOf: ["dev", "prod"] },       // enum validation
 *   SECRET: { pattern: /^.{32,}$/ },            // regex validation
 *   DEBUG: { required: false },                 // optional
 *   HOST: { transform: v => v.toLowerCase() },  // transform
 * });
 * ```
 */
export function guard(schema: Schema): Record<string, string> {
  const errors: ValidationError[] = [];
  const result: Record<string, string> = {};

  for (const [key, rule] of Object.entries(schema)) {
    const value = process.env[key];
    const opts: Rule = typeof rule === "boolean" ? { required: rule } : rule;
    const desc = opts.description ? ` (${opts.description})` : "";

    // Apply default
    if (!value && opts.default !== undefined) {
      result[key] = opts.default;
      continue;
    }

    // Required check
    if (!value && opts.required !== false) {
      errors.push({
        key,
        message: `Missing required env var: ${key}${desc}`,
        rule: "required",
      });
      continue;
    }

    // Skip if not set and not required
    if (!value) continue;

    // Pattern validation
    if (opts.pattern && !opts.pattern.test(value)) {
      errors.push({
        key,
        message: `${key} does not match pattern ${opts.pattern}${desc}`,
        rule: "pattern",
      });
      continue;
    }

    // OneOf validation
    if (opts.oneOf && !opts.oneOf.includes(value)) {
      errors.push({
        key,
        message: `${key} must be one of: ${opts.oneOf.join(", ")} (got "${value}")${desc}`,
        rule: "oneOf",
      });
      continue;
    }

    // Apply transform
    result[key] = opts.transform ? opts.transform(value) : value;
  }

  if (errors.length > 0) {
    const header = `\n\x1b[31mEnvironment validation failed (${errors.length} error${errors.length > 1 ? "s" : ""}):\x1b[0m\n`;
    const details = errors.map(e => `  \x1b[31m\u2717\x1b[0m ${e.message}`).join("\n");
    const hint = "\n\nSet the missing variables in your .env file or environment.\n";
    console.error(header + details + hint);
    process.exit(1);
  }

  return result;
}

export default guard;
