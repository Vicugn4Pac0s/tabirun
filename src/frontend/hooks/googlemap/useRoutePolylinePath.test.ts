import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRoutePolylinePath } from "~/frontend/hooks/googlemap/useRoutePolylinePath";

type MockDirectionQueryResult = {
  directions: { path: google.maps.LatLngLiteral[] } | null;
  error: { data?: { code?: string } } | null;
  isLoading: boolean;
  enabled: boolean;
};

const mockUseGooglemapDirectionQuery = vi.fn<
  (...args: unknown[]) => MockDirectionQueryResult
>();

vi.mock("./useGooglemapDirectionQuery", () => ({
  __esModule: true,
  default: (...args: Parameters<typeof mockUseGooglemapDirectionQuery>) =>
    mockUseGooglemapDirectionQuery(...args),
  useGooglemapDirectionQuery: (
    ...args: Parameters<typeof mockUseGooglemapDirectionQuery>
  ) =>
    mockUseGooglemapDirectionQuery(...args),
}));

const routePoints = [
  { lat: 35.0, lng: 139.0 },
  { lat: 35.1, lng: 139.1 },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockUseGooglemapDirectionQuery.mockReturnValue({
    directions: null,
    error: null,
    isLoading: false,
    enabled: true,
  });
});

describe("useRoutePolylinePath", () => {
  it("directions の path があればそれを返す", () => {
    const path = [
      { lat: 35.0, lng: 139.0 },
      { lat: 35.05, lng: 139.05 },
    ];
    mockUseGooglemapDirectionQuery.mockReturnValue({
      directions: { path },
      error: null,
      isLoading: false,
      enabled: true,
    });

    const { result } = renderHook(() =>
      useRoutePolylinePath(routePoints, { canUseDirections: true }),
    );

    expect(result.current.polylinePath).toEqual(path);
  });

  it("directions を使えないときは直線 polyline にフォールバックする", () => {
    const { result } = renderHook(() =>
      useRoutePolylinePath(routePoints, { canUseDirections: false }),
    );

    expect(result.current.polylinePath).toEqual(routePoints);
  });

  it("quota 超過時は直線 polyline にフォールバックする", () => {
    mockUseGooglemapDirectionQuery.mockReturnValue({
      directions: null,
      error: {
        data: {
          code: "TOO_MANY_REQUESTS",
        },
      },
      isLoading: false,
      enabled: true,
    });

    const { result } = renderHook(() =>
      useRoutePolylinePath(routePoints, { canUseDirections: true }),
    );

    expect(result.current.polylinePath).toEqual(routePoints);
  });

  it("routePoints が不足し directions もないときは null を返す", () => {
    const { result } = renderHook(() =>
      useRoutePolylinePath([{ lat: 35.0, lng: 139.0 }], {
        canUseDirections: true,
      }),
    );

    expect(result.current.polylinePath).toBeNull();
  });
});
