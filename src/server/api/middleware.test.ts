import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/env", () => ({
  env: {
    get NODE_ENV() {
      return process.env.NODE_ENV;
    },
  },
}));

async function createCaller() {
  const { createTRPCRouter, createTRPCProcedure } = await import("./trpc");
  const { timingMiddleware } = await import("./middleware");
  const { db } = await import("~/server/db");
  const resolve = vi.fn(() => "ok");
  const router = createTRPCRouter({
    probe: createTRPCProcedure.use(timingMiddleware).query(resolve),
  });
  return {
    caller: router.createCaller({ db, headers: new Headers(), session: null }),
    resolve,
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(Math, "random").mockReturnValue(0);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("timingMiddleware", () => {
  it("本番では遅延とtimingログを追加せず結果を返す", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { caller } = await createCaller();
    await expect(caller.probe()).resolves.toBe("ok");
    expect(vi.getTimerCount()).toBe(0);
    expect(console.log).not.toHaveBeenCalled();
  });

  it.each([0, 0.999])(
    "開発時の遅延を維持し、実行後にtimingログを出す（random=%s）",
    async (random) => {
      vi.stubEnv("NODE_ENV", "development");
      vi.mocked(Math.random).mockReturnValue(random);
      const { caller, resolve } = await createCaller();
      const pending = caller.probe();
      const delay = Math.floor(random * 400) + 100;
      await vi.advanceTimersByTimeAsync(delay - 1);
      expect(resolve).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      await expect(pending).resolves.toBe("ok");
      expect(console.log).toHaveBeenCalledExactlyOnceWith(
        `[TRPC] probe took ${delay}ms to execute`,
      );
    },
  );

  it("テスト環境では既存の遅延条件を維持し、timingログは出さない", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const { caller } = await createCaller();
    const pending = caller.probe();
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toBe("ok");
    expect(console.log).not.toHaveBeenCalled();
  });

  it("本番のprocedureエラーを変更せず伝播する", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { caller, resolve } = await createCaller();
    resolve.mockImplementation(() => {
      throw new Error("procedure failed");
    });
    await expect(caller.probe()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "procedure failed",
    });
    expect(console.log).not.toHaveBeenCalled();
  });
});
