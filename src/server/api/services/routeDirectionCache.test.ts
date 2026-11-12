import { describe, expect, it, vi } from "vitest";
import {
  getReusableRouteDirection,
  getRoutePointsHash,
  ROUTE_DIRECTION_CACHE_MAX_AGE_MS,
  type RouteDirectionSnapshot,
} from "./routeDirectionCache";

vi.mock("server-only", () => ({}));

const points = [
  { lat: 38.5, lng: -120.2 },
  { lat: 40.7, lng: -120.95 },
  { lat: 43.252, lng: -126.453 },
];
const now = new Date("2026-11-10T12:00:00Z");
const snapshot: RouteDirectionSnapshot = {
  directionSource: "routes_api",
  encodedPolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
  distanceMeters: 1200,
  duration: "600s",
  directionCalculatedAt: now,
  directionPointsHash: getRoutePointsHash(points),
};

describe("getRoutePointsHash", () => {
  it("座標のプロパティ順序によらず同じhashを生成する", () => {
    expect(
      getRoutePointsHash(points.map(({ lat, lng }) => ({ lng, lat }))),
    ).toBe(getRoutePointsHash(points));
  });

  it("地点の順番・座標・個数が変わればhashが変わる", () => {
    const hash = getRoutePointsHash(points);
    expect(getRoutePointsHash([...points].reverse())).not.toBe(hash);
    expect(
      getRoutePointsHash(points.map((p) => ({ ...p, lat: p.lat + 0.00001 }))),
    ).not.toBe(hash);
    expect(getRoutePointsHash(points.slice(1))).not.toBe(hash);
  });
});

describe("getReusableRouteDirection", () => {
  it("期限内かつ同じ地点なら保存された線を復元する", () => {
    expect(getReusableRouteDirection(snapshot, points, now)).toEqual({
      ...snapshot,
      path: points,
    });
  });

  it.each([
    [ROUTE_DIRECTION_CACHE_MAX_AGE_MS - 1, true],
    [ROUTE_DIRECTION_CACHE_MAX_AGE_MS, false],
    [ROUTE_DIRECTION_CACHE_MAX_AGE_MS + 1, false],
    [-1, false],
  ])("経過時間 %s ms の再利用可否は %s", (age, reusable) => {
    const saved = {
      ...snapshot,
      directionCalculatedAt: new Date(now.getTime() - age),
    };
    expect(getReusableRouteDirection(saved, points, now) !== null).toBe(
      reusable,
    );
  });

  it("地点が変わった保存値は使わない", () => {
    expect(
      getReusableRouteDirection(snapshot, [...points].reverse(), now),
    ).toBeNull();
  });

  it.each([
    null,
    { ...snapshot, directionCalculatedAt: null },
    { ...snapshot, directionCalculatedAt: new Date("invalid") },
    { ...snapshot, directionSource: "unknown" },
    { ...snapshot, distanceMeters: -1 },
    { ...snapshot, duration: "invalid" },
    { ...snapshot, encodedPolyline: null },
    { ...snapshot, encodedPolyline: "?" },
    { ...snapshot, encodedPolyline: "!!!!!!" },
  ])("欠損・不正な保存値は使わない（%#）", (saved) => {
    expect(getReusableRouteDirection(saved, points, now)).toBeNull();
  });

  it("直線結果はUTC日付が変わる直前まで使い、翌日は再取得対象にする", () => {
    const saved: RouteDirectionSnapshot = {
      directionSource: "straight_line",
      encodedPolyline: null,
      distanceMeters: null,
      duration: null,
      directionCalculatedAt: new Date("2026-11-10T23:59:59Z"),
      directionPointsHash: getRoutePointsHash(points),
    };
    expect(
      getReusableRouteDirection(
        saved,
        points,
        new Date("2026-11-10T23:59:59.999Z"),
      ),
    ).toEqual({ ...saved, path: points });
    expect(
      getReusableRouteDirection(
        saved,
        points,
        new Date("2026-11-11T00:00:00Z"),
      ),
    ).toBeNull();
  });

  it("直線という取得元と矛盾する保存値は使わない", () => {
    expect(
      getReusableRouteDirection(
        { ...snapshot, directionSource: "straight_line" },
        points,
        now,
      ),
    ).toBeNull();
  });
});
