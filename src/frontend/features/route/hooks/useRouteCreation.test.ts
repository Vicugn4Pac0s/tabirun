import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRouteCreation } from "./useRouteCreation";
const { createRoute, push, refresh, errorToast, status } = vi.hoisted(() => ({
  createRoute: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  errorToast: vi.fn(),
  status: { isCreating: false },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("../api/useCreateRoute", () => ({
  useCreateRoute: () => ({ createRoute, isCreating: status.isCreating }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: errorToast } }));
const first = { lat: 35, lng: 135 };
const second = { lat: 36, lng: 136 };
const setTitle = (
  form: ReturnType<typeof useRouteCreation>["form"],
  title: string,
) => {
  form.setValue("title", title, { shouldDirty: true, shouldValidate: true });
};
beforeEach(() => {
  vi.clearAllMocks();
  createRoute.mockResolvedValue(undefined);
  status.isCreating = false;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("useRouteCreation", () => {
  it("空欄・0地点から始め、名前と2地点で保存してホームに戻る", async () => {
    const { result } = renderHook(() => useRouteCreation());
    expect(result.current.form.getValues("title")).toBe("");
    expect(result.current.points).toEqual([]);
    await act(() => result.current.save());
    expect(createRoute).not.toHaveBeenCalled();
    act(() => {
      setTitle(result.current.form, " 朝 ");
      result.current.togglePoint(first);
    });
    expect(result.current.canSave).toBe(false);
    act(() => result.current.togglePoint(second));
    await waitFor(() => expect(result.current.canSave).toBe(true));
    await act(() => result.current.save());
    expect(createRoute).toHaveBeenCalledWith({
      title: "朝",
      points: [first, second],
    });
    expect(push).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalled();
  });
  it("保存失敗時は入力を保持し、再試行できる", async () => {
    createRoute.mockRejectedValueOnce(new Error("failed"));
    const { result } = renderHook(() => useRouteCreation());
    act(() => {
      setTitle(result.current.form, "朝");
      result.current.togglePoint(first);
      result.current.togglePoint(second);
    });
    await waitFor(() => expect(result.current.canSave).toBe(true));
    await act(() => result.current.save());
    expect(errorToast).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(result.current.points).toEqual([first, second]);
    await act(() => result.current.save());
    expect(push).toHaveBeenCalledWith("/");
  });
  it("連続送信・保存中の送信を防ぐ", async () => {
    let finish: (() => void) | undefined;
    createRoute.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { result, rerender } = renderHook(() => useRouteCreation());
    act(() => {
      setTitle(result.current.form, "朝");
      result.current.togglePoint(first);
      result.current.togglePoint(second);
    });
    await waitFor(() => expect(result.current.canSave).toBe(true));
    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.save();
      void result.current.save();
    });
    expect(createRoute).toHaveBeenCalledOnce();
    await act(async () => {
      finish?.();
      await pending;
    });
    status.isCreating = true;
    rerender();
    await act(() => result.current.save());
    expect(createRoute).toHaveBeenCalledOnce();
  });
  it("破棄確認を拒否すると保持し、承認すると空の下書きへ戻る", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { result } = renderHook(() => useRouteCreation());
    act(() => {
      setTitle(result.current.form, "朝");
      result.current.togglePoint(first);
    });
    expect(result.current.confirmDiscard()).toBe(false);
    act(() => result.current.reset());
    expect(result.current.form.getValues("title")).toBe("朝");
    confirm.mockReturnValue(true);
    act(() => result.current.reset());
    expect(result.current.form.getValues("title")).toBe("");
    expect(result.current.points).toEqual([]);
    expect(result.current.isDirty).toBe(false);
  });
});
