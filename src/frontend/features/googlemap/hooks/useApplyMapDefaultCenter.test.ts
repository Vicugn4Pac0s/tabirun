import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useApplyMapDefaultCenter } from "~/frontend/features/googlemap/hooks/useApplyMapDefaultCenter";

type MockGoogleMapContext = {
  map: {
    setCenter: typeof setMapCenter;
  } | null;
  streetView: {
    current: {
      setPosition: typeof setStreetViewPosition;
    } | null;
  };
};

const mockUseGoogleMap = vi.fn<() => MockGoogleMapContext>();
const setMapCenter = vi.fn();
const setStreetViewPosition = vi.fn();

vi.mock("../providers/GoogleMapProvider", () => ({
  useGoogleMap: () => mockUseGoogleMap(),
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();

  mockUseGoogleMap.mockReturnValue({
    map: {
      setCenter: setMapCenter,
    },
    streetView: {
      current: {
        setPosition: setStreetViewPosition,
      },
    },
  });
});

describe("useApplyMapDefaultCenter", () => {
  it("enabled が false の間は中心座標を適用しない", () => {
    renderHook(() =>
      useApplyMapDefaultCenter({
        center: { lat: 34.682952, lng: 135.532147 },
        enabled: false,
      })
    );

    expect(setMapCenter).not.toHaveBeenCalled();
    expect(setStreetViewPosition).not.toHaveBeenCalled();
  });

  it("enabled が true なら map と streetView に中心座標を一度だけ適用する", () => {
    const initialCenter = { lat: 34.682952, lng: 135.532147 };
    const nextCenter = { lat: 35.681236, lng: 139.767125 };

    const { rerender } = renderHook(
      ({ center }) =>
        useApplyMapDefaultCenter({
          center,
          enabled: true,
        }),
      {
        initialProps: {
          center: initialCenter,
        },
      }
    );

    rerender({ center: nextCenter });

    expect(setMapCenter).toHaveBeenCalledTimes(1);
    expect(setMapCenter).toHaveBeenCalledWith(initialCenter);
    expect(setStreetViewPosition).toHaveBeenCalledTimes(1);
    expect(setStreetViewPosition).toHaveBeenCalledWith(initialCenter);
  });

  it("map と streetView が別々に初期化されても、それぞれ一度だけ適用する", () => {
    const center = { lat: 34.682952, lng: 135.532147 };

    mockUseGoogleMap.mockReturnValue({
      map: null,
      streetView: {
        current: null,
      },
    });

    const { rerender } = renderHook(() =>
      useApplyMapDefaultCenter({
        center,
        enabled: true,
      })
    );

    expect(setMapCenter).not.toHaveBeenCalled();
    expect(setStreetViewPosition).not.toHaveBeenCalled();

    mockUseGoogleMap.mockReturnValue({
      map: {
        setCenter: setMapCenter,
      },
      streetView: {
        current: null,
      },
    });
    rerender();

    expect(setMapCenter).toHaveBeenCalledTimes(1);
    expect(setMapCenter).toHaveBeenCalledWith(center);
    expect(setStreetViewPosition).not.toHaveBeenCalled();

    mockUseGoogleMap.mockReturnValue({
      map: {
        setCenter: setMapCenter,
      },
      streetView: {
        current: {
          setPosition: setStreetViewPosition,
        },
      },
    });
    rerender();

    expect(setMapCenter).toHaveBeenCalledTimes(1);
    expect(setStreetViewPosition).toHaveBeenCalledTimes(1);
    expect(setStreetViewPosition).toHaveBeenCalledWith(center);
  });
});
