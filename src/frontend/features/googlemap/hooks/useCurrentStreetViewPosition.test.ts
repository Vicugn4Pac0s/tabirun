import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCurrentStreetViewPosition } from "~/frontend/features/googlemap/hooks/useCurrentStreetViewPosition";

type MockGoogleMapContext = {
  streetView: {
    current: {
      getPosition: typeof getPosition;
    } | null;
  };
};

const mockUseGoogleMap = vi.fn<() => MockGoogleMapContext>();
const getPosition = vi.fn();

vi.mock("../providers/GoogleMapProvider", () => ({
  useGoogleMap: () => mockUseGoogleMap(),
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();

  getPosition.mockReturnValue({
    toJSON: () => ({ lat: 34.682952, lng: 135.532147 }),
  });
  mockUseGoogleMap.mockReturnValue({
    streetView: {
      current: {
        getPosition,
      },
    },
  });
});

describe("useCurrentStreetViewPosition", () => {
  it("Street View が初期化済みなら現在のマーカー座標を返す", () => {
    const { result } = renderHook(() => useCurrentStreetViewPosition());

    expect(result.current.canReadCurrentStreetViewPosition).toBe(true);
    expect(result.current.getCurrentStreetViewPosition()).toEqual({
      lat: 34.682952,
      lng: 135.532147,
    });
  });

  it("Street View が未初期化なら null を返す", () => {
    mockUseGoogleMap.mockReturnValue({
      streetView: {
        current: null,
      },
    });

    const { result } = renderHook(() => useCurrentStreetViewPosition());

    expect(result.current.canReadCurrentStreetViewPosition).toBe(false);
    expect(result.current.getCurrentStreetViewPosition()).toBeNull();
    expect(getPosition).not.toHaveBeenCalled();
  });

  it("マーカー座標が取得できない場合は null を返す", () => {
    getPosition.mockReturnValue(null);

    const { result } = renderHook(() => useCurrentStreetViewPosition());

    expect(result.current.canReadCurrentStreetViewPosition).toBe(true);
    expect(result.current.getCurrentStreetViewPosition()).toBeNull();
  });
});
