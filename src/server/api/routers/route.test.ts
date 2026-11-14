import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { encode } from "@googlemaps/polyline-codec";
import { and, eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { routes } from "~/server/db/schema";
import {
  getRoutePointsHash,
  ROUTE_DIRECTION_CACHE_MAX_AGE_MS,
  type RouteDirectionSnapshot,
} from "~/server/api/services/routeDirectionCache";
import { routeRouter } from "./route";

const {
  findFirst,
  select,
  selectFrom,
  selectWhere,
  lock,
  update,
  updateSet,
  updateWhere,
  remove,
  removeWhere,
  transaction,
  insert,
  insertValues,
  insertReturning,
  hasQuotaRemaining,
  incrementQuota,
  computeRoute,
} = vi.hoisted(() => ({
  findFirst: vi.fn(),
  select: vi.fn(),
  selectFrom: vi.fn(),
  selectWhere: vi.fn(),
  lock: vi.fn(),
  update: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  remove: vi.fn(),
  removeWhere: vi.fn(),
  transaction: vi.fn(),
  insert: vi.fn(),
  insertValues: vi.fn(),
  insertReturning: vi.fn(),
  hasQuotaRemaining: vi.fn(),
  incrementQuota: vi.fn(),
  computeRoute: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("~/server/db", () => ({
  db: {
    query: { routes: { findFirst } },
    select,
    update,
    delete: remove,
    transaction,
    insert,
  },
}));
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/features/googlemap/computeRoute", () => ({ computeRoute }));
vi.mock("~/server/quota/service", () => ({
  hasQuotaRemaining,
  incrementQuota,
}));

const points = [
  { lat: 35, lng: 135 },
  { lat: 36, lng: 136 },
];
const now = new Date("2026-11-11T12:00:00Z");
const savedRoute = {
  id: 1,
  title: "朝のルート",
  points: JSON.stringify(points),
  createdById: "owner",
  createdAt: new Date("2026-10-24T00:00:00Z"),
  updatedAt: null,
};
const snapshot: RouteDirectionSnapshot = {
  directionSource: "routes_api",
  encodedPolyline: encode(points.map(({ lat, lng }) => [lat, lng])),
  distanceMeters: 1200,
  duration: "600s",
  directionCalculatedAt: now,
  directionPointsHash: getRoutePointsHash(points),
};
const routeWithCache = {
  ...savedRoute,
  ...snapshot,
} satisfies typeof routes.$inferSelect;
const emptyCache = {
  encodedPolyline: null,
  distanceMeters: null,
  duration: null,
  directionSource: null,
  directionCalculatedAt: null,
  directionPointsHash: null,
};
const routeWithoutCache = { ...savedRoute, ...emptyCache };

function failAfterRequest(error: Error) {
  computeRoute.mockImplementation(
    (_input: unknown, onRequestStarted?: () => void) => {
      onRequestStarted?.();
      throw error;
    },
  );
}

function createCaller(userId: string | null = "owner") {
  return routeRouter.createCaller({
    db,
    headers: new Headers(),
    session: userId
      ? { user: { id: userId, role: "user" }, expires: "2099-01-01" }
      : null,
  });
}
const updateInput = { id: 1, title: "夕方のルート", points };

beforeEach(() => {
  vi.resetAllMocks();
  hasQuotaRemaining.mockResolvedValue(true);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(now);
  transaction.mockImplementation(
    async (callback: (tx: typeof db) => Promise<unknown>) => callback(db),
  );
  findFirst.mockResolvedValue(savedRoute);
  select.mockReturnValue({ from: selectFrom });
  selectFrom.mockReturnValue({ where: selectWhere });
  selectWhere.mockReturnValue({ for: lock });
  lock.mockResolvedValue([routeWithCache]);
  update.mockReturnValue({ set: updateSet });
  updateSet.mockReturnValue({ where: updateWhere });
  updateWhere.mockResolvedValue({ count: 1 });
  remove.mockReturnValue({ where: removeWhere });
  insert.mockReturnValue({ values: insertValues });
  insertValues.mockReturnValue({ returning: insertReturning });
  insertReturning.mockResolvedValue([routeWithoutCache]);
  computeRoute.mockResolvedValue({
    encodedPolyline: snapshot.encodedPolyline,
    distanceMeters: 1500,
    duration: "700s",
    path: points,
  });
});
afterEach(() => vi.useRealTimers());

describe("route.getByUser", () => {
  it("地点と経路計算結果を取得せず、一覧項目だけを返す", async () => {
    const { id, title, createdById, createdAt, updatedAt } = savedRoute;
    const listRoute = { id, title, createdById, createdAt, updatedAt };
    selectWhere.mockResolvedValue([listRoute]);

    await expect(createCaller().getByUser()).resolves.toEqual([listRoute]);
    expect(select).toHaveBeenCalledWith({
      id: routes.id,
      title: routes.title,
      createdById: routes.createdById,
      createdAt: routes.createdAt,
      updatedAt: routes.updatedAt,
    });
    expect(selectFrom).toHaveBeenCalledWith(routes);
    expect(selectWhere).toHaveBeenCalledWith(eq(routes.createdById, "owner"));
  });

  it("別のユーザーでも、そのログインユーザーの所有者条件で取得する", async () => {
    selectWhere.mockResolvedValue([]);

    await expect(createCaller("other").getByUser()).resolves.toEqual([]);
    expect(selectWhere).toHaveBeenCalledWith(eq(routes.createdById, "other"));
  });

  it("ルート未登録なら空の一覧を返す", async () => {
    selectWhere.mockResolvedValue([]);

    await expect(createCaller().getByUser()).resolves.toEqual([]);
  });

  it("未ログインでは一覧を取得しない", async () => {
    await expect(createCaller(null).getByUser()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(select).not.toHaveBeenCalled();
  });
});

describe("route.getById", () => {
  it("ロック取得を待ってから、その1回で読んだ最新の行を返す", async () => {
    let release: ((rows: (typeof routeWithCache)[]) => void) | undefined;
    let notifyEntered: (() => void) | undefined;
    const entered = new Promise<void>((resolve) => {
      notifyEntered = resolve;
    });
    const waiting = new Promise<(typeof routeWithCache)[]>((resolve) => {
      release = resolve;
    });
    lock.mockImplementation(() => {
      notifyEntered?.();
      return waiting;
    });
    const pending = createCaller().getById({ id: 1 });
    await entered;
    expect(computeRoute).not.toHaveBeenCalled();
    release?.([{ ...routeWithCache, title: "ロック取得後のルート" }]);
    await expect(pending).resolves.toMatchObject({
      title: "ロック取得後のルート",
      direction: { distanceMeters: 1200 },
    });
    expect(select).toHaveBeenCalledOnce();
    expect(transaction).toHaveBeenCalledOnce();
    expect(findFirst).not.toHaveBeenCalled();
    expect(computeRoute).not.toHaveBeenCalled();
  });

  it("IDと所有者の条件で取得し、保存済みの経路を返す", async () => {
    await expect(createCaller().getById({ id: 1 })).resolves.toEqual({
      ...savedRoute,
      points,
      direction: { ...snapshot, path: points },
      directionErrorCode: null,
    });
    expect(selectWhere).toHaveBeenCalledWith(
      and(eq(routes.id, 1), eq(routes.createdById, "owner")),
    );
    expect(lock).toHaveBeenCalledWith("update");
    expect(select).toHaveBeenCalledOnce();
    expect(transaction).toHaveBeenCalledOnce();
    expect(findFirst).not.toHaveBeenCalled();
    expect(computeRoute).not.toHaveBeenCalled();
    expect(hasQuotaRemaining).not.toHaveBeenCalled();
    expect(incrementQuota).not.toHaveBeenCalled();
  });

  it.each([
    emptyCache,
    {
      directionCalculatedAt: new Date(
        now.getTime() - ROUTE_DIRECTION_CACHE_MAX_AGE_MS,
      ),
    },
  ])(
    "未計算・期限切れなら1回だけ取得し、次回は再利用する（%#）",
    async (cache) => {
      lock.mockResolvedValue([{ ...routeWithCache, ...cache }]);
      const first = await createCaller().getById({ id: 1 });
      expect(first.direction?.distanceMeters).toBe(1500);
      expect(updateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          directionSource: "routes_api",
          directionPointsHash: getRoutePointsHash(points),
          updatedAt: sql`${routes.updatedAt}`,
        }),
      );
      lock.mockResolvedValue([{ ...savedRoute, ...first.direction }]);
      await expect(createCaller().getById({ id: 1 })).resolves.toEqual(first);
      expect(computeRoute).toHaveBeenCalledExactlyOnceWith(
        {
          routePoints: points,
          travelMode: "WALK",
        },
        expect.any(Function),
      );
      expect(incrementQuota).toHaveBeenCalledOnce();
    },
  );

  it("他人のルートは所有者条件で除外し、計算も保存もしない", async () => {
    lock.mockResolvedValue([]);
    await expect(
      createCaller("other").getById({ id: 1 }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(selectWhere).toHaveBeenCalledWith(
      and(eq(routes.id, 1), eq(routes.createdById, "other")),
    );
    expect(computeRoute).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("存在しないIDはNOT_FOUNDを返す", async () => {
    lock.mockResolvedValue([]);
    await expect(createCaller().getById({ id: 999 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(computeRoute).not.toHaveBeenCalled();
  });

  it("未ログインではDBにアクセスしない", async () => {
    await expect(createCaller(null).getById({ id: 1 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5])("不正なID %s は拒否する", async (id) => {
    await expect(createCaller().getById({ id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it.each(["invalid-json", JSON.stringify([{ lat: "invalid", lng: 135 }])])(
    "不正な地点データは返さない（%#）",
    async (invalidPoints) => {
      lock.mockResolvedValue([
        {
          ...routeWithCache,
          points: invalidPoints,
        },
      ]);
      await expect(createCaller().getById({ id: 1 })).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
      });
      expect(computeRoute).not.toHaveBeenCalled();
    },
  );

  it.each(["BAD_REQUEST", "NOT_FOUND", "INTERNAL_SERVER_ERROR"] as const)(
    "Googleの%sはルート自体の失敗にせず、詳細を隠した経路エラーとして返す",
    async (code) => {
      lock.mockResolvedValue([routeWithoutCache]);
      failAfterRequest(
        new TRPCError({ code, message: "private-provider-detail" }),
      );
      const result = await createCaller().getById({ id: 1 });
      expect(result).toEqual({
        ...savedRoute,
        points,
        direction: null,
        directionErrorCode: "INTERNAL_SERVER_ERROR",
      });
      expect(JSON.stringify(result)).not.toContain("private-provider-detail");
      expect(update).not.toHaveBeenCalled();
      expect(incrementQuota).toHaveBeenCalledExactlyOnceWith(
        db,
        "owner",
        "direction",
      );
    },
  );

  it("クォータ上限時もルートを返し、直線結果として保存する", async () => {
    lock.mockResolvedValue([routeWithoutCache]);
    hasQuotaRemaining.mockResolvedValue(false);
    await expect(createCaller().getById({ id: 1 })).resolves.toMatchObject({
      id: 1,
      direction: {
        directionSource: "straight_line",
        path: points,
        distanceMeters: null,
      },
      directionErrorCode: null,
    });
    expect(computeRoute).not.toHaveBeenCalled();
    expect(incrementQuota).not.toHaveBeenCalled();
  });

  it("DB障害は経路取得失敗に変換せず、失敗として返す", async () => {
    lock.mockResolvedValue([routeWithoutCache]);
    hasQuotaRemaining.mockRejectedValue(new Error("db failed"));
    await expect(createCaller().getById({ id: 1 })).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });
});

describe("route.create", () => {
  it("クライアントの計算結果を使わず、サーバーで計算して保存する", async () => {
    lock.mockResolvedValue([routeWithoutCache]);
    const input = {
      title: "朝のルート",
      points,
      encodedPolyline: "forged-line",
      distanceMeters: 1,
      directionSource: "routes_api",
    };
    await expect(createCaller().create(input)).resolves.toBeUndefined();
    expect(insertValues).toHaveBeenCalledWith({
      title: input.title,
      points: JSON.stringify(points),
      createdById: "owner",
    });
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        encodedPolyline: snapshot.encodedPolyline,
        distanceMeters: 1500,
      }),
    );
    expect(computeRoute).toHaveBeenCalledExactlyOnceWith(
      {
        routePoints: points,
        travelMode: "WALK",
      },
      expect.any(Function),
    );
    expect(incrementQuota).toHaveBeenCalledOnce();
    expect(select).not.toHaveBeenCalled();
    expect(transaction).toHaveBeenCalledOnce();
  });

  it("上限到達時もルートを保存し、直線として扱う", async () => {
    lock.mockResolvedValue([routeWithoutCache]);
    hasQuotaRemaining.mockResolvedValue(false);
    await expect(
      createCaller().create({ title: "朝のルート", points }),
    ).resolves.toBeUndefined();
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        directionSource: "straight_line",
        encodedPolyline: null,
      }),
    );
    expect(computeRoute).not.toHaveBeenCalled();
    expect(incrementQuota).not.toHaveBeenCalled();
  });

  it("Googleの障害でも登録地点の保存は成功させ、不正な経路は保存しない", async () => {
    lock.mockResolvedValue([routeWithoutCache]);
    failAfterRequest(new TRPCError({ code: "BAD_REQUEST" }));
    await expect(
      createCaller().create({ title: "朝のルート", points }),
    ).resolves.toBeUndefined();
    expect(insertValues).toHaveBeenCalledOnce();
    expect(updateSet).not.toHaveBeenCalled();
    expect(incrementQuota).toHaveBeenCalledExactlyOnceWith(
      db,
      "owner",
      "direction",
    );
  });

  it("未ログインでは作成も計算もしない", async () => {
    await expect(
      createCaller(null).create({ title: "朝のルート", points }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(transaction).not.toHaveBeenCalled();
    expect(computeRoute).not.toHaveBeenCalled();
  });

  it("DBへの作成失敗を成功として返さない", async () => {
    insertReturning.mockRejectedValue(new Error("db failed"));
    await expect(
      createCaller().create({ title: "朝のルート", points }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(computeRoute).not.toHaveBeenCalled();
  });
});

describe("route.update", () => {
  it.each([routeWithCache, routeWithoutCache])(
    "タイトルだけの変更では保存値の有無によらず再計算しない（%#）",
    async (existing) => {
      lock.mockResolvedValue([existing]);
      const input = {
        ...updateInput,
        encodedPolyline: "forged-line",
        directionPointsHash: "forged-hash",
      };
      await expect(createCaller().update(input)).resolves.toBeUndefined();
      expect(updateSet).toHaveBeenCalledExactlyOnceWith({
        title: input.title,
        points: JSON.stringify(points),
        updatedAt: now,
      });
      expect(updateWhere).toHaveBeenCalledWith(
        and(eq(routes.id, 1), eq(routes.createdById, "owner")),
      );
      expect(hasQuotaRemaining).not.toHaveBeenCalled();
      expect(computeRoute).not.toHaveBeenCalled();
      expect(incrementQuota).not.toHaveBeenCalled();
    },
  );

  it("地点変更時は古い保存値を消し、新しい地点で計算して保存する", async () => {
    const changed = [...points].reverse();
    lock.mockResolvedValueOnce([routeWithCache]);
    await expect(
      createCaller().update({ ...updateInput, points: changed }),
    ).resolves.toBeUndefined();
    expect(updateSet).toHaveBeenNthCalledWith(1, {
      title: updateInput.title,
      points: JSON.stringify(changed),
      updatedAt: now,
      ...emptyCache,
    });
    expect(updateSet).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        directionPointsHash: getRoutePointsHash(changed),
        encodedPolyline: snapshot.encodedPolyline,
      }),
    );
    expect(computeRoute).toHaveBeenCalledExactlyOnceWith(
      {
        routePoints: changed,
        travelMode: "WALK",
      },
      expect.any(Function),
    );
    expect(incrementQuota).toHaveBeenCalledOnce();
    expect(select).toHaveBeenCalledOnce();
    expect(lock).toHaveBeenCalledOnce();
    expect(transaction).toHaveBeenCalledOnce();
  });

  it("地点変更後の計算失敗時も変更は保存し、旧経路は残さない", async () => {
    const changed = [...points].reverse();
    lock.mockResolvedValueOnce([routeWithCache]);
    failAfterRequest(new TRPCError({ code: "NOT_FOUND" }));
    await expect(
      createCaller().update({ ...updateInput, points: changed }),
    ).resolves.toBeUndefined();
    expect(updateSet).toHaveBeenCalledExactlyOnceWith({
      title: updateInput.title,
      points: JSON.stringify(changed),
      updatedAt: now,
      ...emptyCache,
    });
    expect(incrementQuota).toHaveBeenCalledExactlyOnceWith(
      db,
      "owner",
      "direction",
    );
  });

  it("他人のルートは所有者条件で除外し、変更も計算もしない", async () => {
    lock.mockResolvedValue([]);
    await expect(
      createCaller("other").update(updateInput),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(selectWhere).toHaveBeenCalledWith(
      and(eq(routes.id, 1), eq(routes.createdById, "other")),
    );
    expect(update).not.toHaveBeenCalled();
    expect(computeRoute).not.toHaveBeenCalled();
  });

  it("存在しないルートはNOT_FOUNDを返す", async () => {
    lock.mockResolvedValue([]);
    await expect(
      createCaller().update({ ...updateInput, id: 999 }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(selectWhere).toHaveBeenCalledWith(
      and(eq(routes.id, 999), eq(routes.createdById, "owner")),
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("更新0件を成功として返さない", async () => {
    updateWhere.mockResolvedValue({ count: 0 });
    await expect(createCaller().update(updateInput)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(computeRoute).not.toHaveBeenCalled();
  });

  it("未ログインでは更新しない", async () => {
    await expect(createCaller(null).update(updateInput)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(transaction).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});

describe("route.delete", () => {
  it("自分のルートはIDと所有者の両方を条件に削除する", async () => {
    removeWhere.mockResolvedValue({ count: 1 });

    await expect(createCaller().delete({ id: 1 })).resolves.toBeUndefined();

    expect(remove).toHaveBeenCalledWith(routes);
    expect(removeWhere).toHaveBeenCalledWith(
      and(eq(routes.id, 1), eq(routes.createdById, "owner")),
    );
  });

  it("他人のルートは所有者条件で削除せず NOT_FOUND を返す", async () => {
    removeWhere.mockResolvedValue({ count: 0 });

    await expect(createCaller("other").delete({ id: 1 })).rejects.toMatchObject(
      { code: "NOT_FOUND" },
    );
    expect(removeWhere).toHaveBeenCalledWith(
      and(eq(routes.id, 1), eq(routes.createdById, "other")),
    );
    expect(removeWhere).toHaveBeenCalledOnce();
  });

  it("存在しないルートは NOT_FOUND を返す", async () => {
    removeWhere.mockResolvedValue({ count: 0 });

    await expect(createCaller().delete({ id: 999 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(removeWhere).toHaveBeenCalledWith(
      and(eq(routes.id, 999), eq(routes.createdById, "owner")),
    );
  });

  it("未ログインでは削除しない", async () => {
    await expect(createCaller(null).delete({ id: 1 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(remove).not.toHaveBeenCalled();
  });
});
