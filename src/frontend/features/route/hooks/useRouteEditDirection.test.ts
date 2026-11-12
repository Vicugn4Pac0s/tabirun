import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRouteEditDirection } from "./useRouteEditDirection";

const { directionsQuery } = vi.hoisted(() => ({ directionsQuery: vi.fn() }));
vi.mock("~/frontend/features/googlemap/api/useGoogleMapDirectionQuery", () => ({
  useGoogleMapDirectionQuery: directionsQuery,
}));

const points = [
  { lat: 35, lng: 135 },
  { lat: 36, lng: 136 },
];
const savedDirection = {
  directionSource: "routes_api",
  encodedPolyline: "saved-polyline",
  distanceMeters: 5200,
  duration: "1800s",
  directionCalculatedAt: new Date("2026-11-11T00:00:00Z"),
  directionPointsHash: "saved-hash",
  path: [...points, { lat: 37, lng: 137 }],
} satisfies NonNullable<
  Parameters<typeof useRouteEditDirection>[0]["direction"]
>;
const route = {
  points,
  direction: savedDirection,
  directionErrorCode: null,
} satisfies Parameters<typeof useRouteEditDirection>[0];

beforeEach(() => {
  vi.clearAllMocks();
  directionsQuery.mockReturnValue({
    directions: null,
    isLoading: false,
    error: null,
  });
});
afterEach(cleanup);

describe("useRouteEditDirection", () => {
  it("同じ座標なら別の配列でも保存済み経路を使い、計算を無効にする", () => {
    const { result } = renderHook(() =>
      useRouteEditDirection(
        route,
        points.map((point) => ({ ...point })),
      ),
    );
    expect(directionsQuery).toHaveBeenLastCalledWith(points, {
      enabled: false,
    });
    expect(result.current).toEqual({
      polylinePath: savedDirection.path,
      directions: savedDirection,
      isLoading: false,
      warningMessage: null,
    });
  });

  it.each([
    { changed: [...points, { lat: 37, lng: 137 }] },
    { changed: [...points].reverse() },
    { changed: points.map((point) => ({ ...point, lat: point.lat + 0.1 })) },
    { changed: points.map((point) => ({ ...point, lng: point.lng + 0.1 })) },
  ])("地点の追加・順序・緯度・経度の変更で再計算する（%#）", ({ changed }) => {
    const calculated = { path: changed, distanceMeters: 3000 };
    directionsQuery.mockReturnValue({
      directions: calculated,
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useRouteEditDirection(route, changed));
    expect(directionsQuery).toHaveBeenLastCalledWith(changed, {
      enabled: true,
    });
    expect(result.current.polylinePath).toEqual(changed);
    expect(result.current.directions).toBe(calculated);
  });

  it("変更後の計算中は保存済みの距離・経路を表示しない", () => {
    directionsQuery.mockReturnValue({
      directions: null,
      isLoading: true,
      error: null,
    });
    const { result } = renderHook(() =>
      useRouteEditDirection(route, [...points].reverse()),
    );
    expect(result.current.isLoading).toBe(true);
    expect(result.current.directions).toBeNull();
    expect(result.current.polylinePath).toBeNull();
  });

  it("変更後に上限へ達した場合は現在の地点を直線で結ぶ", () => {
    const changed = [...points].reverse();
    directionsQuery.mockReturnValue({
      directions: null,
      isLoading: false,
      error: { data: { code: "TOO_MANY_REQUESTS" } },
    });
    const { result } = renderHook(() => useRouteEditDirection(route, changed));
    expect(result.current.polylinePath).toEqual(changed);
    expect(result.current.warningMessage).toContain("直線で結んで表示");
  });

  it("変更後の計算失敗時は旧経路を使わず、元の地点へ戻せば警告も消す", () => {
    directionsQuery.mockReturnValue({
      directions: null,
      isLoading: false,
      error: { data: { code: "INTERNAL_SERVER_ERROR" } },
    });
    const { result, rerender } = renderHook(
      ({ currentPoints }) => useRouteEditDirection(route, currentPoints),
      { initialProps: { currentPoints: [...points].reverse() } },
    );
    expect(result.current.polylinePath).toBeNull();
    expect(result.current.warningMessage).toContain("経由地点のみ表示");
    rerender({ currentPoints: points });
    expect(result.current.polylinePath).toEqual(savedDirection.path);
    expect(result.current.warningMessage).toBeNull();
    expect(directionsQuery).toHaveBeenLastCalledWith(points, {
      enabled: false,
    });
  });

  it.each([{ changed: [] }, { changed: points.slice(1) }])(
    "2地点未満では経路線を表示しない（%#）",
    ({ changed }) => {
      const { result } = renderHook(() =>
        useRouteEditDirection(route, changed),
      );
      expect(result.current.polylinePath).toBeNull();
      expect(result.current.directions).toBeNull();
    },
  );
});
