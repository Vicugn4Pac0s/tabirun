import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { useRouteDetails } from "./useRouteDetails";

const { updateDetails, completeRoute, push, refresh } = vi.hoisted(() => ({
  updateDetails: vi.fn(),
  completeRoute: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("../api/useUpdateRouteDetails", () => ({
  useUpdateRouteDetails: () => ({ updateDetails, isUpdating: false }),
}));
vi.mock("../api/useCompleteRoute", () => ({
  useCompleteRoute: () => ({ completeRoute, isCompleting: false }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const draft = {
  id: 1,
  title: "2026/11/24のルート",
  status: "draft",
} satisfies Parameters<typeof useRouteDetails>[0];
beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("useRouteDetails", () => {
  it("仮名のまま下書きを完了できる", async () => {
    const { result } = renderHook(() => useRouteDetails(draft));
    await waitFor(() => expect(result.current.canSave).toBe(true));
    await act(() => result.current.save());
    expect(updateDetails).not.toHaveBeenCalled();
    expect(completeRoute).toHaveBeenCalledExactlyOnceWith({ id: 1 });
    expect(push).toHaveBeenCalledWith("/routes/1");
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("名前を保存してから下書きを完了する", async () => {
    const { result } = renderHook(() => useRouteDetails(draft));
    act(() =>
      result.current.form.setValue("title", " 夜のルート ", {
        shouldDirty: true,
      }),
    );
    await act(() => result.current.save());
    expect(updateDetails).toHaveBeenCalledWith({ id: 1, title: "夜のルート" });
    expect(updateDetails.mock.invocationCallOrder[0]).toBeLessThan(
      completeRoute.mock.invocationCallOrder[0] ?? 0,
    );
    expect(result.current.form.formState.isDirty).toBe(false);
  });

  it("完了済みなら名前だけを更新する", async () => {
    const { result } = renderHook(() =>
      useRouteDetails({ ...draft, status: "completed" }),
    );
    expect(result.current.canSave).toBe(false);
    act(() =>
      result.current.form.setValue("title", "新しい名前", {
        shouldDirty: true,
      }),
    );
    await act(() => result.current.save());
    expect(updateDetails).toHaveBeenCalledWith({ id: 1, title: "新しい名前" });
    expect(completeRoute).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/routes/1");
  });

  it("地図へ戻る前に名前を保存し、下書きは完了しない", async () => {
    const { result } = renderHook(() => useRouteDetails(draft));
    act(() =>
      result.current.form.setValue("title", "保持する名前", {
        shouldDirty: true,
      }),
    );
    await act(() => result.current.editMap());
    expect(updateDetails).toHaveBeenCalledWith({
      id: 1,
      title: "保持する名前",
    });
    expect(completeRoute).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/routes/1/edit");
  });

  it.each(["save", "editMap"] as const)(
    "名前保存失敗時は%sで遷移せず入力を保持する",
    async (operation) => {
      updateDetails.mockRejectedValue(new Error("failed"));
      const { result } = renderHook(() => useRouteDetails(draft));
      act(() =>
        result.current.form.setValue("title", "保持する名前", {
          shouldDirty: true,
        }),
      );
      await act(() => result.current[operation]());
      expect(push).not.toHaveBeenCalled();
      expect(completeRoute).not.toHaveBeenCalled();
      expect(result.current.form.getValues("title")).toBe("保持する名前");
      expect(result.current.form.formState.isDirty).toBe(true);
      expect(toast.error).toHaveBeenCalledOnce();
    },
  );

  it("完了失敗後は保存済みの名前を保持して完了だけ再試行する", async () => {
    completeRoute.mockRejectedValueOnce(new Error("failed"));
    const { result } = renderHook(() => useRouteDetails(draft));
    act(() =>
      result.current.form.setValue("title", "保存済みの名前", {
        shouldDirty: true,
      }),
    );
    await act(() => result.current.save());
    expect(push).not.toHaveBeenCalled();
    expect(result.current.form.getValues("title")).toBe("保存済みの名前");
    await act(() => result.current.save());
    expect(updateDetails).toHaveBeenCalledOnce();
    expect(completeRoute).toHaveBeenCalledTimes(2);
    expect(push).toHaveBeenCalledWith("/routes/1");
  });

  it.each(["", "   ", "a".repeat(257)])(
    "不正な名前では保存も地図遷移もしない",
    async (title) => {
      const { result } = renderHook(() => useRouteDetails(draft));
      act(() =>
        result.current.form.setValue("title", title, { shouldDirty: true }),
      );
      await act(() => result.current.save());
      await act(() => result.current.editMap());
      expect(updateDetails).not.toHaveBeenCalled();
      expect(completeRoute).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalled();
    },
  );

  it("保存と地図への連続操作を重複送信せず、保存中は移動を拒否する", async () => {
    let finish: (() => void) | undefined;
    completeRoute.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { result } = renderHook(() => useRouteDetails(draft));
    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.save();
      void result.current.editMap();
    });
    await waitFor(() => expect(completeRoute).toHaveBeenCalledOnce());
    expect(result.current.isSaving).toBe(true);
    expect(result.current.confirmNavigation()).toBe(false);
    await act(async () => {
      finish?.();
      await pending;
    });
    expect(push).toHaveBeenCalledExactlyOnceWith("/routes/1");
  });

  it("名前変更中は離脱を警告し、保存後は解除する", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { result } = renderHook(() => useRouteDetails(draft));
    act(() =>
      result.current.form.setValue("title", "変更", { shouldDirty: true }),
    );
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(result.current.confirmNavigation()).toBe(false);
    expect(confirm).toHaveBeenCalledOnce();
    await act(() => result.current.editMap());
    const after = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(after);
    expect(after.defaultPrevented).toBe(false);
  });
});
