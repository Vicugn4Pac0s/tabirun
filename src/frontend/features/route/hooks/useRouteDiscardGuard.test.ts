import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import { useRouteDiscardGuard } from "~/frontend/features/route/hooks/useRouteDiscardGuard";

const mockUseRouteEditorState = vi.fn();

vi.mock("~/frontend/features/route/hooks/useRouteEditorState", () => ({
  useRouteEditorState: () => mockUseRouteEditorState(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUseRouteEditorState.mockReturnValue({
    mode: "view",
    isDirty: false,
  });
});

afterEach(() => {
  cleanup();
});

describe("useRouteDiscardGuard", () => {
  it("edit かつ dirty のときだけ確認対象になる", () => {
    mockUseRouteEditorState.mockReturnValue({
      mode: "edit",
      isDirty: true,
    });

    const { result } = renderHook(() => useRouteDiscardGuard());

    expect(result.current.shouldConfirmDiscard).toBe(true);
  });

  it("edit でない、または dirty でないときは確認せず true を返す", () => {
    const { result } = renderHook(() => useRouteDiscardGuard());

    expect(result.current.shouldConfirmDiscard).toBe(false);
    expect(result.current.confirmDiscard()).toBe(true);
  });

  it("edit かつ dirty のときは window.confirm の結果を返す", () => {
    mockUseRouteEditorState.mockReturnValue({
      mode: "edit",
      isDirty: true,
    });
    const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(false);

    const { result } = renderHook(() => useRouteDiscardGuard());

    expect(result.current.confirmDiscard()).toBe(false);
    expect(confirmMock).toHaveBeenCalledWith(
      "未保存の変更があります。破棄して移動しますか？",
    );
  });
});
