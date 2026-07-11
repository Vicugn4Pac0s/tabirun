import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";

type MockGoogleMapContext = {
  streetView: {
    current: {
      setPosition: typeof setPosition;
      setVisible: typeof setVisible;
    } | null;
  };
  setStreetViewUnavailable: typeof setStreetViewUnavailable;
};

const mockUseGoogleMap = vi.fn<() => MockGoogleMapContext>();

vi.mock("../providers/GoogleMapProvider", () => ({
  useGoogleMap: () => mockUseGoogleMap(),
}));

const setPosition = vi.fn();
const setVisible = vi.fn();
const setStreetViewUnavailable = vi.fn();

let panoramaData: {
  location?: {
    latLng?: { toJSON: () => google.maps.LatLngLiteral };
  };
} | null = null;
let panoramaStatus = "ZERO_RESULTS";
const getPanorama = vi.fn();

class MockLatLng {
  constructor(
    private readonly lat: number,
    private readonly lng: number,
  ) {}

  toJSON() {
    return {
      lat: this.lat,
      lng: this.lng,
    };
  }
}

class MockStreetViewService {
  getPanorama(
    request: unknown,
    callback: (
      data: typeof panoramaData,
      status: string,
    ) => void,
  ) {
    getPanorama(request);
    callback(panoramaData, panoramaStatus);
  }
}

beforeEach(() => {
  vi.clearAllMocks();

  panoramaData = null;
  panoramaStatus = "ZERO_RESULTS";

  mockUseGoogleMap.mockReturnValue({
    streetView: {
      current: {
        setPosition,
        setVisible,
      },
    },
    setStreetViewUnavailable,
  });

  Object.defineProperty(window, "google", {
    configurable: true,
    value: {
      maps: {
        LatLng: MockLatLng,
        StreetViewService: MockStreetViewService,
        StreetViewStatus: {
          OK: "OK",
        },
      },
    },
  });
});

describe("useMoveStreetView", () => {
  it("streetView が未初期化なら false を返す", async () => {
    mockUseGoogleMap.mockReturnValue({
      streetView: {
        current: null,
      },
      setStreetViewUnavailable,
    });

    const { result } = renderHook(() => useMoveStreetView());

    await expect(result.current({ lat: 35.0, lng: 139.0 })).resolves.toBe(false);
    expect(getPanorama).not.toHaveBeenCalled();
  });

  it("Street View が利用可能なら position を更新して true を返す", async () => {
    panoramaStatus = "OK";
    panoramaData = {
      location: {
        latLng: {
          toJSON: () => ({ lat: 35.0, lng: 139.0 }),
        },
      },
    };

    const { result } = renderHook(() => useMoveStreetView());

    await expect(
      result.current(new MockLatLng(35.0, 139.0) as unknown as google.maps.LatLng),
    ).resolves.toBe(true);

    expect(getPanorama).toHaveBeenCalledWith({
      location: { lat: 35.0, lng: 139.0 },
      radius: 50,
    });
    expect(setStreetViewUnavailable).toHaveBeenCalledWith(false);
    expect(setPosition).toHaveBeenCalledWith({ lat: 35.0, lng: 139.0 });
    expect(setVisible).toHaveBeenCalledWith(true);
  });

  it("解決位置が得られないときは unavailable にして false を返す", async () => {
    panoramaStatus = "ZERO_RESULTS";
    panoramaData = null;

    const { result } = renderHook(() => useMoveStreetView());

    await expect(result.current({ lat: 35.0, lng: 139.0 })).resolves.toBe(false);

    expect(setStreetViewUnavailable).toHaveBeenCalledWith(true);
    expect(setPosition).not.toHaveBeenCalled();
    expect(setVisible).not.toHaveBeenCalled();
  });

  it("解決位置が遠すぎるときは unavailable にして false を返す", async () => {
    panoramaStatus = "OK";
    panoramaData = {
      location: {
        latLng: {
          toJSON: () => ({ lat: 35.001, lng: 139.001 }),
        },
      },
    };

    const { result } = renderHook(() => useMoveStreetView());

    await expect(result.current({ lat: 35.0, lng: 139.0 })).resolves.toBe(false);

    expect(setStreetViewUnavailable).toHaveBeenCalledWith(true);
    expect(setPosition).not.toHaveBeenCalled();
    expect(setVisible).not.toHaveBeenCalled();
  });
});
