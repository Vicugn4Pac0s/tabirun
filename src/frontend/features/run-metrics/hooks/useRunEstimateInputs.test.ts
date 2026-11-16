import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRunEstimateInputs } from "./useRunEstimateInputs";

const { getUser } = vi.hoisted(() => ({
  getUser: vi.fn<() => { pace: string; weight: number } | null>(),
}));

vi.mock("~/frontend/features/user/api/useCurrentUserQuery", () => ({
  useCurrentUserQuery: () => ({ user: getUser() }),
}));

beforeEach(() => {
  getUser.mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useRunEstimateInputs", () => {
  it("既定ペースからプロフィールのペースへ更新する", () => {
    const { result, rerender } = renderHook(() => useRunEstimateInputs());
    expect(result.current.pace).toBe("5:00");

    getUser.mockReturnValue({ pace: "6:00", weight: 55 });
    rerender();
    expect(result.current.pace).toBe("6:00");
    expect(result.current.weightKg).toBe(55);
  });

  it("画面で選んだペースはプロフィール再取得で上書きしない", () => {
    getUser.mockReturnValue({ pace: "6:00", weight: 55 });
    const { result, rerender } = renderHook(() => useRunEstimateInputs());

    act(() => result.current.setPace("7:00"));
    getUser.mockReturnValue({ pace: "8:00", weight: 60 });
    rerender();

    expect(result.current.pace).toBe("7:00");
    expect(result.current.weightKg).toBe(60);
  });

  it.each(["invalid", "", "100:00", "5:3", " 5:30", "5:30 "])(
    "不正なプロフィールのペース %s は既定値を使う",
    (pace) => {
      getUser.mockReturnValue({ pace, weight: 55 });
      const { result } = renderHook(() => useRunEstimateInputs());
      expect(result.current.pace).toBe("5:00");
    },
  );

  it.each(["0:00", "5:30", "99:99"])(
    "共有schemaで有効なペース %s を使う",
    (pace) => {
      getUser.mockReturnValue({ pace, weight: 55 });
      const { result } = renderHook(() => useRunEstimateInputs());
      expect(result.current.pace).toBe(pace);
    },
  );
});
