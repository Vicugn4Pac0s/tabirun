import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { routes } from "~/server/db/schema";
import {
  getOrComputeRouteDirection,
  RouteDirectionCalculationError,
} from "./getOrComputeRouteDirection";
import {
  getRoutePointsHash,
  ROUTE_DIRECTION_CACHE_MAX_AGE_MS,
} from "./routeDirectionCache";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
  selectWhere: vi.fn(),
  lock: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  updateWhere: vi.fn(),
  checkQuota: vi.fn(),
  incrementQuota: vi.fn(),
  computeRoute: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("~/server/db", () => ({
  db: {
    transaction: mocks.transaction,
    select: mocks.select,
    update: mocks.update,
  },
}));
vi.mock("~/server/quota/service", () => ({
  checkQuota: mocks.checkQuota,
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
  points: JSON.stringify(points),
  createdById: "owner",
  createdAt: new Date("2026-10-01T00:00:00Z"),
  updatedAt: null,
  directionSource: "routes_api",
  encodedPolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
  distanceMeters: 1200,
  duration: "600s",
  directionCalculatedAt: now,
  directionPointsHash: getRoutePointsHash(points),
} satisfies typeof routes.$inferSelect;

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(now);
  mocks.transaction.mockImplementation(
    async (callback: (tx: typeof db) => Promise<unknown>) => callback(db),
  );
  mocks.select.mockReturnValue({ from: mocks.from });
  mocks.from.mockReturnValue({ where: mocks.selectWhere });
  mocks.selectWhere.mockReturnValue({ for: mocks.lock });
  mocks.lock.mockResolvedValue([savedRoute]);
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

describe("getOrComputeRouteDirection", () => {
  it("有効な保存値はクォータを確認・消費せず、DBにも書き戻さない", async () => {
    const result = await getOrComputeRouteDirection(db, "owner", 1);
    expect(result.distanceMeters).toBe(1200);
    expect(result.path).toHaveLength(3);
    expect(mocks.lock).toHaveBeenCalledWith("update");
    expect(mocks.checkQuota).not.toHaveBeenCalled();
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
      mocks.lock.mockResolvedValue([{ ...savedRoute, ...change }]);
      const result = await getOrComputeRouteDirection(db, "owner", 1);
      expect(mocks.computeRoute).toHaveBeenCalledExactlyOnceWith({
        routePoints: points,
        travelMode: "WALK",
      });
      expect(mocks.checkQuota).toHaveBeenCalledWith(db, "owner", "direction");
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
      expect(result.distanceMeters).toBe(1500);
      expect(result.path).toHaveLength(3);
    },
  );

  it("他人のルート・存在しないルートは所有者条件で除外し、外部APIも更新も実行しない", async () => {
    mocks.lock.mockResolvedValue([]);
    await expect(
      getOrComputeRouteDirection(db, "other", 1),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mocks.selectWhere).toHaveBeenCalledWith(
      and(eq(routes.id, 1), eq(routes.createdById, "other")),
    );
    expect(mocks.checkQuota).not.toHaveBeenCalled();
    expect(mocks.computeRoute).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("一度保存した結果は次の取得で再計算しない", async () => {
    mocks.lock.mockResolvedValue([
      { ...savedRoute, directionCalculatedAt: null },
    ]);
    const first = await getOrComputeRouteDirection(db, "owner", 1);
    mocks.lock.mockResolvedValue([{ ...savedRoute, ...first }]);
    await expect(getOrComputeRouteDirection(db, "owner", 1)).resolves.toEqual(
      first,
    );
    expect(mocks.computeRoute).toHaveBeenCalledOnce();
    expect(mocks.incrementQuota).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledOnce();
  });

  it("登録地点が変わっていれば、新しい地点を使って再計算する", async () => {
    const changed = [...points].reverse();
    mocks.lock.mockResolvedValue([
      { ...savedRoute, points: JSON.stringify(changed) },
    ]);
    const result = await getOrComputeRouteDirection(db, "owner", 1);
    expect(mocks.computeRoute).toHaveBeenCalledExactlyOnceWith({
      routePoints: changed,
      travelMode: "WALK",
    });
    expect(result.directionPointsHash).toBe(getRoutePointsHash(changed));
  });

  it("上限到達時は直線結果を保存し、Googleも利用回数加算も呼ばない", async () => {
    mocks.lock.mockResolvedValue([
      { ...savedRoute, directionCalculatedAt: null },
    ]);
    mocks.checkQuota.mockRejectedValue(
      new TRPCError({ code: "TOO_MANY_REQUESTS" }),
    );
    const result = await getOrComputeRouteDirection(db, "owner", 1);
    expect(result).toEqual({
      directionSource: "straight_line",
      encodedPolyline: null,
      distanceMeters: null,
      duration: null,
      directionCalculatedAt: now,
      directionPointsHash: getRoutePointsHash(points),
      path: points,
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
    mocks.lock.mockResolvedValue([
      {
        ...savedRoute,
        directionSource: "straight_line",
        encodedPolyline: null,
        distanceMeters: null,
        duration: null,
      },
    ]);
    await expect(
      getOrComputeRouteDirection(db, "owner", 1),
    ).resolves.toMatchObject({ directionSource: "straight_line" });
    expect(mocks.checkQuota).not.toHaveBeenCalled();
    vi.setSystemTime(new Date("2026-11-11T00:00:00Z"));
    await expect(
      getOrComputeRouteDirection(db, "owner", 1),
    ).resolves.toMatchObject({ directionSource: "routes_api" });
    expect(mocks.computeRoute).toHaveBeenCalledOnce();
  });

  it("ロック待ちの間にはGoogleを呼ばず、取得後の最新保存値を使う", async () => {
    let release: ((rows: (typeof savedRoute)[]) => void) | undefined;
    mocks.lock.mockReturnValue(
      new Promise<(typeof savedRoute)[]>((resolve) => {
        release = resolve;
      }),
    );
    const pending = getOrComputeRouteDirection(db, "owner", 1);
    expect(mocks.computeRoute).not.toHaveBeenCalled();
    release?.([savedRoute]);
    await expect(pending).resolves.toMatchObject({ distanceMeters: 1200 });
    expect(mocks.computeRoute).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("クォータ確認中にUTC日付が変わっても、前日の上限結果を翌日まで固定しない", async () => {
    vi.setSystemTime(new Date("2026-11-10T23:59:59Z"));
    mocks.lock.mockResolvedValue([
      { ...savedRoute, directionCalculatedAt: null },
    ]);
    mocks.checkQuota.mockImplementationOnce(() => {
      vi.setSystemTime(new Date("2026-11-11T00:00:00Z"));
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    });
    const first = await getOrComputeRouteDirection(db, "owner", 1);
    expect(first.directionCalculatedAt).toEqual(
      new Date("2026-11-10T23:59:59Z"),
    );
    mocks.lock.mockResolvedValue([{ ...savedRoute, ...first }]);
    await expect(
      getOrComputeRouteDirection(db, "owner", 1),
    ).resolves.toMatchObject({ directionSource: "routes_api" });
    expect(mocks.computeRoute).toHaveBeenCalledOnce();
  });

  it("書き戻せなかった場合は成功として返さない", async () => {
    mocks.lock.mockResolvedValue([
      { ...savedRoute, directionCalculatedAt: null },
    ]);
    mocks.updateWhere.mockResolvedValue({ count: 0 });
    await expect(
      getOrComputeRouteDirection(db, "owner", 1),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("クォータ取得の障害を上限到達として扱わない", async () => {
    mocks.lock.mockResolvedValue([
      { ...savedRoute, directionCalculatedAt: null },
    ]);
    mocks.checkQuota.mockRejectedValue(new Error("database error"));
    await expect(getOrComputeRouteDirection(db, "owner", 1)).rejects.toThrow(
      "database error",
    );
    expect(mocks.computeRoute).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it.each([
    new TRPCError({ code: "BAD_REQUEST" }),
    new TRPCError({ code: "NOT_FOUND" }),
  ])("外部APIの失敗は保存せず、利用回数も加算しない（%#）", async (error) => {
    mocks.lock.mockResolvedValue([
      { ...savedRoute, directionCalculatedAt: null },
    ]);
    mocks.computeRoute.mockRejectedValue(error);
    await expect(
      getOrComputeRouteDirection(db, "owner", 1),
    ).rejects.toMatchObject({ cause: error });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.incrementQuota).not.toHaveBeenCalled();
  });

  it("保存に必要なpolylineがない応答は保存しない", async () => {
    mocks.lock.mockResolvedValue([
      { ...savedRoute, directionCalculatedAt: null },
    ]);
    mocks.computeRoute.mockResolvedValue({
      encodedPolyline: null,
      distanceMeters: 1200,
      duration: "600s",
      path: [],
    });
    await expect(
      getOrComputeRouteDirection(db, "owner", 1),
    ).rejects.toBeInstanceOf(RouteDirectionCalculationError);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.incrementQuota).not.toHaveBeenCalled();
  });

  it("DBの不正な地点JSONはGoogleへ送らない", async () => {
    mocks.lock.mockResolvedValue([{ ...savedRoute, points: "invalid" }]);
    await expect(getOrComputeRouteDirection(db, "owner", 1)).rejects.toThrow();
    expect(mocks.computeRoute).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
