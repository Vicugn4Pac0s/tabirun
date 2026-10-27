import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRouteEdit } from "./useRouteEdit";
const { updateRoute, push, refresh, status } = vi.hoisted(() => ({
  updateRoute: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  status: { isUpdating: false },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("../api/useUpdateRoute", () => ({
  useUpdateRoute: () => ({ updateRoute, isUpdating: status.isUpdating }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const route = {
  id: 1,
  title: "朝",
  points: [
    { lat: 35, lng: 135 },
    { lat: 36, lng: 136 },
  ],
};
const setTitle = (
  form: ReturnType<typeof useRouteEdit>["draft"]["form"],
  title: string,
) => {
  form.setValue("title", title, { shouldDirty: true, shouldValidate: true });
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  status.isUpdating = false;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const initialRoute = {
  id: 2,
  title: "朝のルート",
  points: [
    { lat: 35, lng: 135 },
    { lat: 36, lng: 136 },
  ],
};

describe("useRouteEdit", () => {
  it("保存済みルートを初期値にする", () => {
    const { result } = renderHook(() => useRouteEdit(initialRoute));
    expect(result.current.draft.form.getValues("title")).toBe(
      initialRoute.title,
    );
    expect(result.current.draft.points).toEqual(initialRoute.points);
  });

  it("タイトル変更や親の再描画で経由地点を変えず、入力を上書きしない", () => {
    const { result, rerender } = renderHook(
      ({ route }) => useRouteEdit(route),
      { initialProps: { route: initialRoute } },
    );
    act(() => setTitle(result.current.draft.form, "夕方のルート"));
    rerender({ route: { ...initialRoute, title: "再取得したルート名" } });
    expect(result.current.draft.form.getValues("title")).toBe("夕方のルート");
    expect(result.current.draft.points).toEqual(initialRoute.points);
    expect(initialRoute.title).toBe("朝のルート");
  });

  it("別の編集画面に下書きが混入しない", () => {
    const first = renderHook(() => useRouteEdit(initialRoute));
    act(() => setTitle(first.result.current.draft.form, "編集中"));
    const second = renderHook(() => useRouteEdit(initialRoute));
    expect(second.result.current.draft.form.getValues("title")).toBe(
      "朝のルート",
    );
  });
  it("地点の追加・削除を下書きに反映し、リセットで元へ戻す", async () => {
    const { result } = renderHook(() => useRouteEdit(initialRoute));
    const point = { lat: 37, lng: 137 };
    act(() => result.current.draft.togglePoint(point));
    expect(result.current.draft.points).toEqual([
      ...initialRoute.points,
      point,
    ]);
    expect(result.current.draft.form.getValues("points")).toEqual([
      ...initialRoute.points,
      point,
    ]);
    await waitFor(() => expect(result.current.draft.canSave).toBe(true));
    act(() => result.current.draft.togglePoint(initialRoute.points[0]!));
    expect(result.current.draft.points).toEqual([
      initialRoute.points[1],
      point,
    ]);
    act(() => result.current.draft.reset());
    expect(result.current.draft.points).toEqual(initialRoute.points);
    expect(result.current.draft.form.getValues("points")).toEqual(
      initialRoute.points,
    );
    expect(result.current.draft.isDirty).toBe(false);
    expect(initialRoute.points).toHaveLength(2);
  });

  it("空白のみの名前や2地点未満では保存できない", async () => {
    const { result } = renderHook(() => useRouteEdit(initialRoute));
    act(() => setTitle(result.current.draft.form, "   "));
    expect(result.current.draft.canSave).toBe(false);
    act(() => setTitle(result.current.draft.form, "変更"));
    await waitFor(() => expect(result.current.draft.canSave).toBe(true));
    act(() => result.current.draft.togglePoint(initialRoute.points[0]!));
    await waitFor(() => expect(result.current.draft.canSave).toBe(false));
  });
  it("保存前の連続操作を1回の更新にまとめる", async () => {
    let finish: (() => void) | undefined;
    updateRoute.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { result } = renderHook(() => useRouteEdit(route));
    act(() => setTitle(result.current.draft.form, "夜"));
    await waitFor(() => expect(result.current.draft.canSave).toBe(true));
    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.save();
      void result.current.save();
    });
    await waitFor(() => expect(updateRoute).toHaveBeenCalledOnce());
    await waitFor(() => expect(result.current.draft.isSubmitting).toBe(true));
    await act(async () => {
      finish?.();
      await pending;
    });
    expect(result.current.draft.isSubmitting).toBe(false);
    expect(push).toHaveBeenCalledWith("/routes/1");
  });
  it("未変更・不正な下書き・更新中には送信しない", async () => {
    const { result, rerender } = renderHook(() => useRouteEdit(route));
    await act(() => result.current.save());
    act(() => setTitle(result.current.draft.form, "   "));
    await act(() => result.current.save());
    act(() => setTitle(result.current.draft.form, "夜"));
    status.isUpdating = true;
    rerender();
    await act(() => result.current.save());
    expect(updateRoute).not.toHaveBeenCalled();
  });
  it("未保存時のみページを離れる警告を有効にし、リセット後に解除する", () => {
    const { result } = renderHook(() => useRouteEdit(route));
    const dispatch = () => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(dispatch()).toBe(false);
    act(() => setTitle(result.current.draft.form, "夜"));
    expect(dispatch()).toBe(true);
    act(() => result.current.draft.reset());
    expect(dispatch()).toBe(false);
  });
});
