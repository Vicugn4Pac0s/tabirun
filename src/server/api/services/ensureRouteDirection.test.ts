import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { routes } from "~/server/db/schema";
import { ensureRouteDirection } from "./ensureRouteDirection";
import {
  getRoutePointsHash,
  ROUTE_DIRECTION_CACHE_MAX_AGE_MS,
} from "./routeDirectionCache";

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  set: vi.fn(),
  updateWhere: vi.fn(),
  hasQuotaRemaining: vi.fn(),
  incrementQuota: vi.fn(),
  computeRoute: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("~/server/db", () => ({
  db: {
    update: mocks.update,
  },
}));
vi.mock("~/server/quota/service", () => ({
  hasQuotaRemaining: mocks.hasQuotaRemaining,
  incrementQuota: mocks.incrementQuota,
}));
vi.mock("~/server/features/googlemap/computeRoute", () => ({
  computeRoute: mocks.computeRoute,
}));

const points = [
  { lat: 38.5, lng: -120.2 },
  { lat: 43.252, lng: -126.453 },
];
const now = new Date("2026-11-10T12:00:00Z");
const savedRoute = {
  id: 1,
  title: "朝のルート",
  points,
  createdById: "owner",
  createdAt: new Date("2026-10-01T00:00:00Z"),
  updatedAt: null,
  directionSource: "routes_api",
  encodedPolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
  distanceMeters: 1200,
  duration: "600s",
  directionCalculatedAt: now,
  directionPointsHash: getRoutePointsHash(points),
} satisfies Parameters<typeof ensureRouteDirection>[2];

let route: Parameters<typeof ensureRouteDirection>[2];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.hasQuotaRemaining.mockResolvedValue(true);
  vi.useFakeTimers();
  vi.setSystemTime(now);
  route = { ...savedRoute };
  mocks.update.mockReturnValue({ set: mocks.set });
  mocks.set.mockReturnValue({ where: mocks.updateWhere });
  mocks.updateWhere.mockResolvedValue({ count: 1 });
  mocks.computeRoute.mockResolvedValue({
    encodedPolyline: savedRoute.encodedPolyline,
    distanceMeters: 1500,
    duration: "700s",
    path: [],
  });
});
afterEach(() => vi.useRealTimers());

describe("ensureRouteDirection", () => {
  it("有効な保存値はクォータを確認・消費せず、DBにも書き戻さない", async () => {
    const result = await ensureRouteDirection(db, "owner", route);
    expect(result.direction?.distanceMeters).toBe(1200);
    expect(result.direction?.path).toHaveLength(3);
    expect(mocks.hasQuotaRemaining).not.toHaveBeenCalled();
    expect(mocks.computeRoute).not.toHaveBeenCalled();
    expect(mocks.incrementQuota).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it.each([
    { directionCalculatedAt: null },
    {
      directionCalculatedAt: new Date(
        now.getTime() - ROUTE_DIRECTION_CACHE_MAX_AGE_MS,
      ),
    },
    { directionPointsHash: "0".repeat(64) },
    { encodedPolyline: "invalid" },
  ])(
    "欠損・期限切れ・地点不一致・不正な保存値は1回計算して保存する（%#）",
    async (change) => {
      route = { ...savedRoute, ...change };
      const result = await ensureRouteDirection(db, "owner", route);
      expect(mocks.computeRoute).toHaveBeenCalledExactlyOnceWith(
        {
          routePoints: points,
          travelMode: "WALK",
        },
        expect.any(Function),
      );
      expect(mocks.hasQuotaRemaining).toHaveBeenCalledWith(
        db,
        "owner",
        "direction",
      );
      expect(mocks.incrementQuota).toHaveBeenCalledExactlyOnceWith(
        db,
        "owner",
        "direction",
      );
      expect(mocks.set).toHaveBeenCalledWith({
        encodedPolyline: savedRoute.encodedPolyline,
        distanceMeters: 1500,
        duration: "700s",
        directionSource: "routes_api",
        directionCalculatedAt: now,
        directionPointsHash: getRoutePointsHash(points),
        updatedAt: sql`${routes.updatedAt}`,
      });
      expect(mocks.updateWhere).toHaveBeenCalledWith(
        and(eq(routes.id, 1), eq(routes.createdById, "owner")),
      );
      expect(result.direction?.distanceMeters).toBe(1500);
      expect(result.direction?.path).toHaveLength(3);
    },
  );

  it("他人のルートを渡された場合も計算・更新を拒否する", async () => {
    await expect(
      ensureRouteDirection(db, "other", route),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mocks.hasQuotaRemaining).not.toHaveBeenCalled();
    expect(mocks.computeRoute).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("一度保存した結果は次の取得で再計算しない", async () => {
    route = { ...savedRoute, directionCalculatedAt: null };
    const first = await ensureRouteDirection(db, "owner", route);
    route = { ...savedRoute, ...first.direction };
    await expect(ensureRouteDirection(db, "owner", route)).resolves.toEqual(
      first,
    );
    expect(mocks.computeRoute).toHaveBeenCalledOnce();
    expect(mocks.incrementQuota).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledOnce();
  });

  it("登録地点が変わっていれば、新しい地点を使って再計算する", async () => {
    const changed = [...points].reverse();
    route = { ...savedRoute, points: changed };
    const result = await ensureRouteDirection(db, "owner", route);
    expect(mocks.computeRoute).toHaveBeenCalledExactlyOnceWith(
      {
        routePoints: changed,
        travelMode: "WALK",
      },
      expect.any(Function),
    );
    expect(result.direction?.directionPointsHash).toBe(
      getRoutePointsHash(changed),
    );
  });

  it("上限到達時は直線結果を保存し、Googleも利用回数加算も呼ばない", async () => {
    route = { ...savedRoute, directionCalculatedAt: null };
    mocks.hasQuotaRemaining.mockResolvedValue(false);
    const result = await ensureRouteDirection(db, "owner", route);
    expect(result).toEqual({
      direction: {
        directionSource: "straight_line",
        encodedPolyline: null,
        distanceMeters: null,
        duration: null,
        directionCalculatedAt: now,
        directionPointsHash: getRoutePointsHash(points),
        path: points,
      },
      directionErrorCode: null,
    });
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        directionSource: "straight_line",
        encodedPolyline: null,
      }),
    );
    expect(mocks.computeRoute).not.toHaveBeenCalled();
    expect(mocks.incrementQuota).not.toHaveBeenCalled();
  });

  it("同じUTC日の直線結果は再利用し、翌日はGoogleから再取得する", async () => {
    route = {
      ...savedRoute,
      directionSource: "straight_line",
      encodedPolyline: null,
      distanceMeters: null,
      duration: null,
    };
    await expect(
      ensureRouteDirection(db, "owner", route),
    ).resolves.toMatchObject({
      direction: { directionSource: "straight_line" },
    });
    expect(mocks.hasQuotaRemaining).not.toHaveBeenCalled();
    vi.setSystemTime(new Date("2026-11-11T00:00:00Z"));
    await expect(
      ensureRouteDirection(db, "owner", route),
    ).resolves.toMatchObject({ direction: { directionSource: "routes_api" } });
    expect(mocks.computeRoute).toHaveBeenCalledOnce();
  });

  it("クォータ確認中にUTC日付が変わっても、前日の上限結果を翌日まで固定しない", async () => {
    vi.setSystemTime(new Date("2026-11-10T23:59:59Z"));
    route = { ...savedRoute, directionCalculatedAt: null };
    mocks.hasQuotaRemaining.mockImplementationOnce(() => {
      vi.setSystemTime(new Date("2026-11-11T00:00:00Z"));
      return false;
    });
    const first = await ensureRouteDirection(db, "owner", route);
    expect(first.direction?.directionCalculatedAt).toEqual(
      new Date("2026-11-10T23:59:59Z"),
    );
    route = { ...savedRoute, ...first.direction };
    await expect(
      ensureRouteDirection(db, "owner", route),
    ).resolves.toMatchObject({ direction: { directionSource: "routes_api" } });
    expect(mocks.computeRoute).toHaveBeenCalledOnce();
  });

  it("書き戻せなかった場合は成功として返さない", async () => {
    route = { ...savedRoute, directionCalculatedAt: null };
    mocks.updateWhere.mockResolvedValue({ count: 0 });
    await expect(
      ensureRouteDirection(db, "owner", route),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("クォータ取得の障害を上限到達として扱わない", async () => {
    route = { ...savedRoute, directionCalculatedAt: null };
    mocks.hasQuotaRemaining.mockRejectedValue(new Error("database error"));
    await expect(ensureRouteDirection(db, "owner", route)).rejects.toThrow(
      "database error",
    );
    expect(mocks.computeRoute).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("利用回数の加算に失敗した場合は例外を伝播させる", async () => {
    route = { ...savedRoute, directionCalculatedAt: null };
    const error = new Error("quota update failed");
    mocks.incrementQuota.mockRejectedValue(error);
    await expect(ensureRouteDirection(db, "owner", route)).rejects.toBe(error);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("経路の保存に失敗した場合は例外を伝播させる", async () => {
    route = { ...savedRoute, directionCalculatedAt: null };
    const error = new Error("route update failed");
    mocks.updateWhere.mockRejectedValue(error);
    await expect(ensureRouteDirection(db, "owner", route)).rejects.toBe(error);
  });

  it.each([
    new TRPCError({ code: "BAD_REQUEST" }),
    new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "NO_API_KEY" }),
  ])("送信前の失敗は保存せず、利用回数も加算しない（%#）", async (error) => {
    route = { ...savedRoute, directionCalculatedAt: null };
    mocks.computeRoute.mockRejectedValue(error);
    await expect(ensureRouteDirection(db, "owner", route)).resolves.toEqual({
      direction: null,
      directionErrorCode: "INTERNAL_SERVER_ERROR",
    });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.incrementQuota).not.toHaveBeenCalled();
  });

  it("保存に必要なpolylineがない応答も利用回数を数え、保存はしない", async () => {
    route = { ...savedRoute, directionCalculatedAt: null };
    mocks.computeRoute.mockResolvedValue({
      encodedPolyline: null,
      distanceMeters: 1200,
      duration: "600s",
      path: [],
    });
    await expect(ensureRouteDirection(db, "owner", route)).resolves.toEqual({
      direction: null,
      directionErrorCode: "INTERNAL_SERVER_ERROR",
    });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.incrementQuota).toHaveBeenCalledExactlyOnceWith(
      db,
      "owner",
      "direction",
    );
  });
});

describe("送信開始後の利用回数", () => {
  it.each([
    new TRPCError({ code: "BAD_REQUEST" }),
    new TRPCError({ code: "NOT_FOUND" }),
    new TRPCError({ code: "INTERNAL_SERVER_ERROR" }),
    new TypeError("network error"),
    new DOMException("request timed out", "TimeoutError"),
  ])(
    "HTTPエラー・応答不正・通信例外・タイムアウトも1回数える（%#）",
    async (error) => {
      route = { ...savedRoute, directionCalculatedAt: null };
      mocks.computeRoute.mockImplementation(
        (_input: unknown, onRequestStarted?: () => void) => {
          onRequestStarted?.();
          throw error;
        },
      );
      await expect(ensureRouteDirection(db, "owner", route)).resolves.toEqual({
        direction: null,
        directionErrorCode: "INTERNAL_SERVER_ERROR",
      });
      expect(mocks.incrementQuota).toHaveBeenCalledExactlyOnceWith(
        db,
        "owner",
        "direction",
      );
      expect(mocks.update).not.toHaveBeenCalled();
    },
  );

  it("検証に入る前に利用回数を加算する", async () => {
    route = { ...savedRoute, directionCalculatedAt: null };
    const readPolyline = vi.fn(() => null);
    mocks.computeRoute.mockResolvedValue({
      get encodedPolyline() {
        return readPolyline();
      },
      distanceMeters: 1200,
      duration: "600s",
      path: [],
    });
    await expect(
      ensureRouteDirection(db, "owner", route),
    ).resolves.toMatchObject({ direction: null });
    expect(mocks.incrementQuota).toHaveBeenCalledOnce();
    expect(readPolyline).toHaveBeenCalledOnce();
    expect(mocks.incrementQuota.mock.invocationCallOrder[0]).toBeLessThan(
      readPolyline.mock.invocationCallOrder[0] ?? Infinity,
    );
  });

  it("送信失敗後の利用回数加算でDB障害が起きても握りつぶさない", async () => {
    route = { ...savedRoute, directionCalculatedAt: null };
    mocks.computeRoute.mockImplementation(
      (_input: unknown, onRequestStarted?: () => void) => {
        onRequestStarted?.();
        throw new TypeError("network error");
      },
    );
    const error = new Error("quota update failed");
    mocks.incrementQuota.mockRejectedValue(error);
    await expect(ensureRouteDirection(db, "owner", route)).rejects.toBe(error);
  });
});
