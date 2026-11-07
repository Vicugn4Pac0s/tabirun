// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("SKIP_ENV_VALIDATION", "");
  vi.stubEnv("GOOGLE_CLIENT_ID", "test-client");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-secret");
  vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/test");
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAP_API_KEY", "test-public-key");
  vi.stubEnv("NEXT_PRIVATE_GOOGLE_MAP_API_KEY", "test-private-key");
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Mapsキーの環境変数検証", () => {
  it("両方設定されていれば読み込める", async () => {
    const { env } = await import("./env.js");
    expect(env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY).toBe("test-public-key");
    expect(env.NEXT_PRIVATE_GOOGLE_MAP_API_KEY).toBe("test-private-key");
  });
  it.each([
    ["NEXT_PUBLIC_GOOGLE_MAP_API_KEY", undefined],
    ["NEXT_PRIVATE_GOOGLE_MAP_API_KEY", undefined],
    ["NEXT_PUBLIC_GOOGLE_MAP_API_KEY", ""],
    ["NEXT_PRIVATE_GOOGLE_MAP_API_KEY", ""],
  ])("%s が %j なら読み込み時にエラーになる", async (name, value) => {
    vi.stubEnv(name, value);
    await expect(import("./env.js")).rejects.toThrow(
      "Invalid environment variables",
    );
  });
});
