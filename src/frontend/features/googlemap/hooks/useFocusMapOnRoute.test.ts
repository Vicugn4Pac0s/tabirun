import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFocusMapOnRoute } from "~/frontend/features/googlemap/hooks/useFocusMapOnRoute";

const fitBounds = vi.fn();
const extend = vi.fn();

class MockLatLngBounds {
  extend = extend;
}

type MockGoogleMapContext = {
  map: {
    fitBounds: typeof fitBounds;
  } | null;
};

const mockUseGoogleMap = vi.fn<() => MockGoogleMapContext>();

vi.mock("../providers/GoogleMapProvider", () => ({
  useGoogleMap: () => mockUseGoogleMap(),
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("google", {
    maps: {
      LatLngBounds: MockLatLngBounds,
    },
  });
  mockUseGoogleMap.mockReturnValue({
    map: {
      fitBounds,
    },
  });
});

describe("useFocusMapOnRoute", () => {
  it("指定したルートの全ポイントを含む範囲へフォーカスする", () => {
    const routePoints = [
      { lat: 35.681236, lng: 139.767125 },
      { lat: 35.658034, lng: 139.701636 },
    ];
    const { result } = renderHook(() => useFocusMapOnRoute());

    const didFocus = result.current.focusMapOnRoute(routePoints);

    expect(didFocus).toBe(true);
    expect(extend).toHaveBeenNthCalledWith(1, routePoints[0]);
    expect(extend).toHaveBeenNthCalledWith(2, routePoints[1]);
    expect(fitBounds).toHaveBeenCalledTimes(1);
    expect(fitBounds).toHaveBeenCalledWith(expect.any(MockLatLngBounds), 48);
  });

  it("地図が未初期化ならフォーカスしない", () => {
    mockUseGoogleMap.mockReturnValue({ map: null });
    const { result } = renderHook(() => useFocusMapOnRoute());

    const didFocus = result.current.focusMapOnRoute([
      { lat: 35.681236, lng: 139.767125 },
      { lat: 35.658034, lng: 139.701636 },
    ]);

    expect(didFocus).toBe(false);
    expect(extend).not.toHaveBeenCalled();
    expect(fitBounds).not.toHaveBeenCalled();
  });

  it("ポイントが空ならフォーカスしない", () => {
    const { result } = renderHook(() => useFocusMapOnRoute());

    const didFocus = result.current.focusMapOnRoute([]);

    expect(didFocus).toBe(false);
    expect(extend).not.toHaveBeenCalled();
    expect(fitBounds).not.toHaveBeenCalled();
  });

  it("hookの再描画だけではフォーカスしない", () => {
    const { rerender } = renderHook(() => useFocusMapOnRoute());

    rerender();

    expect(fitBounds).not.toHaveBeenCalled();
  });
});
