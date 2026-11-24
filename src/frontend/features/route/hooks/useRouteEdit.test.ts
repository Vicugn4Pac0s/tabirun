import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRouteEdit } from "./useRouteEdit";
const { updatePoints, push, refresh } = vi.hoisted(() => ({
  updatePoints: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("../api/useUpdateRoutePoints", () => ({
  useUpdateRoutePoints: () => ({ updatePoints, isUpdating: false }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const route = {
  id: 1,
  status: "completed",
  points: [
    { lat: 35, lng: 135 },
    { lat: 36, lng: 136 },
  ],
} satisfies Parameters<typeof useRouteEdit>[0];
const extra = { lat: 37, lng: 137 };
beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("useRouteEdit", () => {
  it.each(["draft", "completed"] as const)(
    "%sの地点だけを更新し、状態に応じた画面へ戻る",
    async (status) => {
      const { result } = renderHook(() => useRouteEdit({ ...route, status }));
      act(() => result.current.draft.togglePoint(extra));
      await act(() => result.current.save());
      expect(updatePoints).toHaveBeenCalledExactlyOnceWith({
        id: 1,
        points: [...route.points, extra],
      });
      expect(push).toHaveBeenCalledWith(
        status === "draft" ? "/routes/1/details" : "/routes/1",
      );
      expect(refresh).toHaveBeenCalledOnce();
      expect(result.current.draft.isDirty).toBe(false);
    },
  );
  it("未変更や2地点未満では送信しない", async () => {
    const { result } = renderHook(() => useRouteEdit(route));
    await act(() => result.current.save());
    act(() => result.current.draft.togglePoint(route.points[0] ?? extra));
    await act(() => result.current.save());
    expect(updatePoints).not.toHaveBeenCalled();
  });
  it("保存失敗時は地点を保持して再試行する", async () => {
    updatePoints.mockRejectedValueOnce(new Error("failed"));
    const { result } = renderHook(() => useRouteEdit(route));
    act(() => result.current.draft.togglePoint(extra));
    await act(() => result.current.save());
    expect(result.current.draft.points).toEqual([...route.points, extra]);
    expect(result.current.draft.isDirty).toBe(true);
    expect(push).not.toHaveBeenCalled();
    await act(() => result.current.save());
    expect(push).toHaveBeenCalledWith("/routes/1");
  });
  it("連続送信を1回にし、保存中はリセットしない", async () => {
    const confirm = vi.spyOn(window, "confirm");
    let finish: (() => void) | undefined;
    updatePoints.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { result } = renderHook(() => useRouteEdit(route));
    act(() => result.current.draft.togglePoint(extra));
    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.save();
      void result.current.save();
    });
    await waitFor(() => expect(updatePoints).toHaveBeenCalledOnce());
    act(() => result.current.draft.reset());
    expect(confirm).not.toHaveBeenCalled();
    await act(async () => {
      finish?.();
      await pending;
    });
    expect(push).toHaveBeenCalledOnce();
  });
  it("再描画で地点を上書きせず、リセットと離脱確認を行う", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { result, rerender } = renderHook(
      ({ initial }) => useRouteEdit(initial),
      { initialProps: { initial: route } },
    );
    act(() => result.current.draft.togglePoint(extra));
    rerender({ initial: { ...route, points: [] } });
    expect(result.current.draft.points).toEqual([...route.points, extra]);
    expect(result.current.draft.confirmDiscard()).toBe(false);
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    act(() => result.current.draft.reset());
    expect(result.current.draft.points).toHaveLength(3);
    confirm.mockReturnValue(true);
    act(() => result.current.draft.reset());
    expect(result.current.draft.points).toEqual(route.points);
    expect(result.current.draft.isDirty).toBe(false);
  });
});
