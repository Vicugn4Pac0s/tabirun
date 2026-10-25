import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRouteDeletion } from "./useRouteDeletion";

const { deleteRoute, replace, refresh, success, error, status } = vi.hoisted(
  () => ({
    deleteRoute: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    status: { isDeleting: false },
  }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));
vi.mock("../api/useDeleteRoute", () => ({
  useDeleteRoute: () => ({ deleteRoute, isDeleting: status.isDeleting }),
}));
vi.mock("sonner", () => ({ toast: { success, error } }));

beforeEach(() => {
  vi.clearAllMocks();
  status.isDeleting = false;
  deleteRoute.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("useRouteDeletion", () => {
  it("確認をキャンセルしたら削除しない", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const { result } = renderHook(() => useRouteDeletion(42));

    await act(() => result.current.remove());

    expect(deleteRoute).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("削除成功後にホームへ戻る", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { result } = renderHook(() => useRouteDeletion(42));

    await act(() => result.current.remove());

    expect(deleteRoute).toHaveBeenCalledWith({ id: 42 });
    expect(success).toHaveBeenCalledWith("ルートを削除しました。");
    expect(replace).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("削除失敗時は画面に留まり再試行できる", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    deleteRoute.mockRejectedValueOnce(new Error("failed"));
    const { result } = renderHook(() => useRouteDeletion(42));

    await act(() => result.current.remove());
    expect(error).toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();

    await act(() => result.current.remove());
    expect(deleteRoute).toHaveBeenCalledTimes(2);
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("削除中の連続操作を防ぐ", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    let finish: (() => void) | undefined;
    deleteRoute.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { result, rerender } = renderHook(() => useRouteDeletion(42));
    let pending: Promise<void> | undefined;

    act(() => {
      pending = result.current.remove();
      void result.current.remove();
    });
    expect(deleteRoute).toHaveBeenCalledOnce();
    await act(async () => {
      finish?.();
      await pending;
    });

    status.isDeleting = true;
    rerender();
    await act(() => result.current.remove());
    expect(deleteRoute).toHaveBeenCalledOnce();
  });
});
