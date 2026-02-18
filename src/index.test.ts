import { guard } from "./index";

describe("guard", () => {
  const orig = process.env;
  beforeEach(() => { process.env = { ...orig }; });
  afterAll(() => { process.env = orig; });

  it("passes with valid env", () => {
    process.env.API_KEY = "test123";
    process.env.NODE_ENV = "production";
    const env = guard({
      API_KEY: true,
      NODE_ENV: { oneOf: ["development", "production"] },
      OPTIONAL: { required: false, default: "fallback" },
    });
    expect(env.API_KEY).toBe("test123");
    expect(env.OPTIONAL).toBe("fallback");
  });
});
