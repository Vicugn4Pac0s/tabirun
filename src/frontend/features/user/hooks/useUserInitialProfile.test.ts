import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUserInitialProfile } from "./useUserInitialProfile";
const { saveApi, navigate, status } = vi.hoisted(() => ({
  saveApi: vi.fn(),
  navigate: vi.fn(),
  status: { pending: false },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigate, refresh: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("~/frontend/features/user/api/useCompleteInitialProfile", () => ({
  useCompleteInitialProfile: () => ({
    completeInitialProfile: saveApi,
    isCompleting: status.pending,
  }),
}));
const profile = {
  birthDate: "1990-01-01",
  gender: "male",
  pace: "6:00",
  height: 170,
  weight: 60,
};
beforeEach(() => {
  vi.clearAllMocks();
  status.pending = false;
  saveApi.mockResolvedValue(undefined);
});
afterEach(cleanup);
describe("useUserInitialProfile", () => {
  it("再描画前の連続送信とuseCompleteInitialProfile処理中の送信を防ぐ", async () => {
    let finish: () => void = vi.fn();
    saveApi.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { result, rerender } = renderHook(() =>
      useUserInitialProfile(profile),
    );
    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.save();
      void result.current.save();
    });
    await waitFor(() => expect(saveApi).toHaveBeenCalledOnce());
    expect(result.current.isCompleting).toBe(true);
    await act(async () => {
      await result.current.save();
    });
    expect(saveApi).toHaveBeenCalledOnce();
    await act(async () => {
      finish();
      await pending;
    });
    expect(navigate).toHaveBeenCalledOnce();
    status.pending = true;
    rerender();
    await act(async () => {
      await result.current.save();
    });
    expect(saveApi).toHaveBeenCalledOnce();
  });
  it("失敗後と入力エラー後にガードを解除して再送信できる", async () => {
    const { result } = renderHook(() => useUserInitialProfile(profile));
    act(() => result.current.form.setValue("height", -1));
    await act(async () => {
      await result.current.save();
    });
    expect(saveApi).not.toHaveBeenCalled();
    act(() => result.current.form.setValue("height", 170));
    saveApi.mockRejectedValueOnce(new Error("failure"));
    await act(async () => {
      await result.current.save();
    });
    expect(navigate).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.save();
    });
    expect(saveApi).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledOnce();
  });
});
