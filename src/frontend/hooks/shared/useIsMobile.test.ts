import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "./useIsMobile";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useIsMobile", () => {
  it("初期の画面幅と変更を反映し、終了時に購読を解除する", () => {
    let onChange: (() => void) | undefined;
    const mediaQuery = {
      matches: true,
      addEventListener: vi.fn((event: string, listener: () => void) => {
        if (event === "change") onChange = listener;
      }),
      removeEventListener: vi.fn(),
    };
    const matchMedia = vi.fn(() => mediaQuery);
    vi.stubGlobal("matchMedia", matchMedia);

    const { result, unmount } = renderHook(() => useIsMobile());
    expect(matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
    expect(result.current).toBe(true);

    act(() => {
      mediaQuery.matches = false;
      onChange?.();
    });
    expect(result.current).toBe(false);

    unmount();
    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith(
      "change",
      onChange,
    );
  });
});
