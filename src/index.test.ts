import { guard } from "./index";

describe("guard", () => {
  const orig = process.env;
  beforeEach(() => { process.env = { ...orig }; });
  afterAll(() => { process.env = orig; });

  // Spy on process.exit and console.error to prevent actual exit in tests
  let exitSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  beforeEach(() => {
    exitSpy = jest.spyOn(process, "exit").mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe("required variables", () => {
    it("passes with valid required env var", () => {
      process.env.API_KEY = "test123";
      const env = guard({ API_KEY: true });
      expect(env.API_KEY).toBe("test123");
    });

    it("exits when required env var is missing", () => {
      delete process.env.API_KEY;
      expect(() => guard({ API_KEY: true })).toThrow("process.exit(1)");
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required env var: API_KEY")
      );
    });

    it("treats boolean shorthand true as required", () => {
      delete process.env.SECRET;
      expect(() => guard({ SECRET: true })).toThrow("process.exit(1)");
    });

    it("treats boolean shorthand false as optional", () => {
      delete process.env.OPTIONAL;
      const env = guard({ OPTIONAL: false });
      expect(env.OPTIONAL).toBeUndefined();
    });
  });

  describe("default values", () => {
    it("uses default when env var is not set", () => {
      delete process.env.PORT;
      const env = guard({ PORT: { default: "3000" } });
      expect(env.PORT).toBe("3000");
    });

    it("uses actual value over default when env var is set", () => {
      process.env.PORT = "8080";
      const env = guard({ PORT: { default: "3000" } });
      expect(env.PORT).toBe("8080");
    });
  });

  describe("pattern validation", () => {
    it("passes when value matches pattern", () => {
      process.env.API_KEY = "sk_test_abc";
      const env = guard({ API_KEY: { pattern: /^sk_/ } });
      expect(env.API_KEY).toBe("sk_test_abc");
    });

    it("exits when value does not match pattern", () => {
      process.env.API_KEY = "invalid";
      expect(() => guard({ API_KEY: { pattern: /^sk_/ } })).toThrow("process.exit(1)");
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("API_KEY does not match pattern")
      );
    });
  });

  describe("oneOf validation", () => {
    it("passes when value is in oneOf list", () => {
      process.env.NODE_ENV = "production";
      const env = guard({ NODE_ENV: { oneOf: ["development", "production"] } });
      expect(env.NODE_ENV).toBe("production");
    });

    it("exits when value is not in oneOf list", () => {
      process.env.NODE_ENV = "staging";
      expect(() =>
        guard({ NODE_ENV: { oneOf: ["development", "production"] } })
      ).toThrow("process.exit(1)");
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('must be one of: development, production (got "staging")')
      );
    });
  });

  describe("transform", () => {
    it("applies transform function to the value", () => {
      process.env.HOST = "EXAMPLE.COM";
      const env = guard({ HOST: { transform: (v) => v.toLowerCase() } });
      expect(env.HOST).toBe("example.com");
    });
  });

  describe("description in errors", () => {
    it("includes description in error message when provided", () => {
      delete process.env.DB_URL;
      expect(() =>
        guard({ DB_URL: { description: "PostgreSQL connection string" } })
      ).toThrow("process.exit(1)");
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("(PostgreSQL connection string)")
      );
    });
  });

  describe("multiple errors", () => {
    it("reports all validation errors at once", () => {
      delete process.env.A;
      delete process.env.B;
      expect(() => guard({ A: true, B: true })).toThrow("process.exit(1)");
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("2 errors")
      );
    });
  });

  describe("combined rules", () => {
    it("passes with all valid env vars in a complex schema", () => {
      process.env.API_KEY = "test123";
      process.env.NODE_ENV = "production";
      const env = guard({
        API_KEY: true,
        NODE_ENV: { oneOf: ["development", "production"] },
        OPTIONAL: { required: false, default: "fallback" },
      });
      expect(env.API_KEY).toBe("test123");
      expect(env.NODE_ENV).toBe("production");
      expect(env.OPTIONAL).toBe("fallback");
    });

    it("skips optional vars without default when not set", () => {
      delete process.env.DEBUG;
      const env = guard({ DEBUG: { required: false } });
      expect(env.DEBUG).toBeUndefined();
    });
  });
});
