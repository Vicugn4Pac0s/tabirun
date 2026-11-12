import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computeRoute } from "./computeRoute";

const { settings } = vi.hoisted(() => ({ settings: { key: "test-key" } }));
vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    get NEXT_PRIVATE_GOOGLE_MAP_API_KEY() {
      return settings.key;
    },
  },
}));
const input = {
  routePoints: [
    { lat: 35, lng: 135 },
    { lat: 36, lng: 136 },
  ],
  travelMode: "WALK",
} satisfies Parameters<typeof computeRoute>[0];

beforeEach(() => {
  settings.key = "test-key";
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("computeRoute", () => {
  it.each(["key", "points"])(
    "%sが不正なら送信開始を通知せず、fetchも呼ばない",
    async (invalid) => {
      if (invalid === "key") settings.key = "";
      const onRequestStarted = vi.fn();
      await expect(
        computeRoute(
          invalid === "points" ? { ...input, routePoints: [] } : input,
          onRequestStarted,
        ),
      ).rejects.toBeInstanceOf(Error);
      expect(onRequestStarted).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it.each([200, 500])(
    "HTTP %sでもfetch開始前に1回だけ送信を通知する",
    async (status) => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const onRequestStarted = vi.fn();
      vi.mocked(fetch).mockImplementation(async () => {
        expect(onRequestStarted).toHaveBeenCalledOnce();
        return new Response(
          JSON.stringify({ routes: [{ distanceMeters: 100 }] }),
          { status },
        );
      });
      await computeRoute(input, onRequestStarted).catch(() => undefined);
      expect(onRequestStarted).toHaveBeenCalledOnce();
      expect(fetch).toHaveBeenCalledOnce();
    },
  );

  it("10秒のAbortSignalで通信を中断し、タイムアウト例外を呼出側へ返す", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const timeoutError = new DOMException("request timed out", "TimeoutError");
    const timeout = vi
      .spyOn(AbortSignal, "timeout")
      .mockImplementation((delay) => {
        setTimeout(() => controller.abort(timeoutError), delay);
        return controller.signal;
      });
    vi.mocked(fetch).mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener(
            "abort",
            () => reject(timeoutError),
            { once: true },
          );
        }),
    );
    const onRequestStarted = vi.fn();
    const pending = computeRoute(input, onRequestStarted);
    const rejected = expect(pending).rejects.toBe(timeoutError);
    expect(timeout).toHaveBeenCalledExactlyOnceWith(10_000);
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    );
    await vi.advanceTimersByTimeAsync(9_999);
    expect(controller.signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await rejected;
    expect(controller.signal.aborted).toBe(true);
    expect(onRequestStarted).toHaveBeenCalledOnce();
  });
});
