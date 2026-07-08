import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import { useEnterKey } from "~/frontend/hooks/shared/useEnterKey";

afterEach(() => {
  cleanup();
});

describe("useEnterKey", () => {
  it("Enter キー押下時に onEnter を呼ぶ", () => {
    const onEnter = vi.fn();

    renderHook(() => useEnterKey(onEnter));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it("Enter 以外のキーでは onEnter を呼ばない", () => {
    const onEnter = vi.fn();

    renderHook(() => useEnterKey(onEnter));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onEnter).not.toHaveBeenCalled();
  });

  it("enabled=false のとき Enter を押しても反応しない", () => {
    const onEnter = vi.fn();

    renderHook(() => useEnterKey(onEnter, { enabled: false }));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(onEnter).not.toHaveBeenCalled();
  });

  it("preventDefault=true のとき preventDefault を呼ぶ", () => {
    const onEnter = vi.fn();

    renderHook(() => useEnterKey(onEnter, { preventDefault: true }));

    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      cancelable: true,
    });
    const preventDefault = vi.fn();
    Object.defineProperty(event, "preventDefault", {
      value: preventDefault,
    });

    window.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it("preventDefault=false のとき preventDefault を呼ばない", () => {
    const onEnter = vi.fn();

    renderHook(() => useEnterKey(onEnter, { preventDefault: false }));

    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      cancelable: true,
    });
    const preventDefault = vi.fn();
    Object.defineProperty(event, "preventDefault", {
      value: preventDefault,
    });

    window.dispatchEvent(event);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(onEnter).toHaveBeenCalledTimes(1);
  });
});
