import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRouteCreateMap } from "./useRouteCreateMap";
const { createDraft, replace, refresh, errorToast, status } = vi.hoisted(
  () => ({
    createDraft: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    errorToast: vi.fn(),
    status: { isCreating: false },
  }),
);
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));
vi.mock("../api/useCreateRouteDraft", () => ({
  useCreateRouteDraft: () => ({ createDraft, isCreating: status.isCreating }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: errorToast } }));
const first = { lat: 35, lng: 135 };
const second = { lat: 36, lng: 136 };
beforeEach(() => {
  vi.clearAllMocks();
  createDraft.mockResolvedValue({ id: 42 });
  status.isCreating = false;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("useRouteCreateMap", () => {
  it("0地点から始め、2地点で下書きを保存して詳細入力に進む", async () => {
    const { result } = renderHook(() => useRouteCreateMap());
    expect(result.current.pointsForm.points).toEqual([]);
    await act(() => result.current.save());
    expect(createDraft).not.toHaveBeenCalled();
    act(() => {
      result.current.pointsForm.togglePoint(first);
    });
    expect(result.current.pointsForm.canSave).toBe(false);
    act(() => result.current.pointsForm.togglePoint(second));
    await waitFor(() => expect(result.current.pointsForm.canSave).toBe(true));
    await act(() => result.current.save());
    expect(createDraft).toHaveBeenCalledWith({
      points: [first, second],
    });
    expect(replace).toHaveBeenCalledWith("/routes/42/details");
    expect(refresh).toHaveBeenCalled();
  });
  it("保存失敗時は入力を保持し、再試行できる", async () => {
    createDraft.mockRejectedValueOnce(new Error("failed"));
    const { result } = renderHook(() => useRouteCreateMap());
    act(() => {
      result.current.pointsForm.togglePoint(first);
      result.current.pointsForm.togglePoint(second);
    });
    await waitFor(() => expect(result.current.pointsForm.canSave).toBe(true));
    await act(() => result.current.save());
    expect(errorToast).toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(result.current.pointsForm.points).toEqual([first, second]);
    await act(() => result.current.save());
    expect(replace).toHaveBeenCalledWith("/routes/42/details");
  });
  it("連続送信・保存中の送信を防ぐ", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    let finish: (() => void) | undefined;
    createDraft.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { result, rerender } = renderHook(() => useRouteCreateMap());
    act(() => {
      result.current.pointsForm.togglePoint(first);
      result.current.pointsForm.togglePoint(second);
    });
    await waitFor(() => expect(result.current.pointsForm.canSave).toBe(true));
    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.save();
      void result.current.save();
    });
    await waitFor(() => expect(createDraft).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(result.current.pointsForm.isSubmitting).toBe(true),
    );
    act(() => result.current.pointsForm.reset());
    expect(confirm).not.toHaveBeenCalled();
    await act(async () => {
      finish?.();
      await pending;
    });
    expect(result.current.pointsForm.isSubmitting).toBe(false);
    status.isCreating = true;
    rerender();
    await act(() => result.current.save());
    expect(createDraft).toHaveBeenCalledOnce();
  });
  it("破棄確認を拒否すると保持し、承認すると空の下書きへ戻る", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { result } = renderHook(() => useRouteCreateMap());
    act(() => {
      result.current.pointsForm.togglePoint(first);
    });
    expect(result.current.pointsForm.confirmDiscard()).toBe(false);
    act(() => result.current.pointsForm.reset());
    confirm.mockReturnValue(true);
    act(() => result.current.pointsForm.reset());
    expect(result.current.pointsForm.points).toEqual([]);
    expect(result.current.pointsForm.isDirty).toBe(false);
  });
});
