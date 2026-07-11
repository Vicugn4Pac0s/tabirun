import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCurrentMapCenter } from "~/frontend/features/googlemap/hooks/useCurrentMapCenter";

type MockGoogleMapContext = {
  map: {
    getCenter: typeof getCenter;
  } | null;
};

const mockUseGoogleMap = vi.fn<() => MockGoogleMapContext>();
const getCenter = vi.fn();

vi.mock("../providers/GoogleMapProvider", () => ({
  useGoogleMap: () => mockUseGoogleMap(),
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();

  getCenter.mockReturnValue({
    toJSON: () => ({ lat: 34.682952, lng: 135.532147 }),
  });
  mockUseGoogleMap.mockReturnValue({
    map: {
      getCenter,
    },
  });
});

describe("useCurrentMapCenter", () => {
  it("map が初期化済みなら現在の中心座標を返す", () => {
    const { result } = renderHook(() => useCurrentMapCenter());

    expect(result.current.canReadCurrentMapCenter).toBe(true);
    expect(result.current.getCurrentMapCenter()).toEqual({
      lat: 34.682952,
      lng: 135.532147,
    });
  });

  it("map が未初期化なら null を返す", () => {
    mockUseGoogleMap.mockReturnValue({
      map: null,
    });

    const { result } = renderHook(() => useCurrentMapCenter());

    expect(result.current.canReadCurrentMapCenter).toBe(false);
    expect(result.current.getCurrentMapCenter()).toBeNull();
    expect(getCenter).not.toHaveBeenCalled();
  });

  it("中心座標が取得できない場合は null を返す", () => {
    getCenter.mockReturnValue(null);

    const { result } = renderHook(() => useCurrentMapCenter());

    expect(result.current.canReadCurrentMapCenter).toBe(true);
    expect(result.current.getCurrentMapCenter()).toBeNull();
  });
});
