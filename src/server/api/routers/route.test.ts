import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { encode } from "@googlemaps/polyline-codec";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { routes } from "~/server/db/schema";
import {
  getRoutePointsHash,
  ROUTE_DIRECTION_CACHE_MAX_AGE_MS,
  type RouteDirectionSnapshot,
} from "~/server/features/direction/domain";
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
vi.mock("~/env", () => ({ env: { NODE_ENV: "test" } }));
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
vi.mock("~/server/features/direction/client", () => ({ computeRoute }));
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
  status: "completed",
  title: "朝のルート",
  points: JSON.stringify(points),
  createdById: "owner",
  createdAt: new Date("2026-10-24T00:00:00Z"),
  updatedAt: null,
} satisfies Omit<typeof routes.$inferSelect, keyof RouteDirectionSnapshot>;
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
    session: userId ? { user: { id: userId }, expires: "2099-01-01" } : null,
  });
}
const updateInput = { id: 1, points };

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
  updateWhere.mockReturnValue({
    returning: vi.fn().mockResolvedValue([{ id: 1 }]),
  });
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
    expect(selectWhere).toHaveBeenCalledWith(
      and(eq(routes.createdById, "owner"), eq(routes.status, "completed")),
    );
  });

  it("別のユーザーでも、そのログインユーザーの所有者条件で取得する", async () => {
    selectWhere.mockResolvedValue([]);

    await expect(createCaller("other").getByUser()).resolves.toEqual([]);
    expect(selectWhere).toHaveBeenCalledWith(
      and(eq(routes.createdById, "other"), eq(routes.status, "completed")),
    );
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

describe("下書きと分割した更新API", () => {
  it.each(["createDraft", "updatePoints"] as const)(
    "%sは利用枠がなければ経路APIを呼ばず、直線として保存する",
    async (operation) => {
      hasQuotaRemaining.mockResolvedValue(false);
      const caller = createCaller();
      if (operation === "createDraft") {
        await expect(caller.createDraft({ points })).resolves.toEqual({
          id: 1,
        });
      } else {
        await caller.updatePoints({
          id: 1,
          points: [...points, { lat: 37, lng: 137 }],
        });
      }
      expect(updateSet).toHaveBeenLastCalledWith(
        expect.objectContaining({
          directionSource: "straight_line",
          encodedPolyline: null,
          distanceMeters: null,
        }),
      );
      expect(computeRoute).not.toHaveBeenCalled();
      expect(incrementQuota).not.toHaveBeenCalled();
    },
  );

  it("日付ベースの仮名で下書きを保存し、経路を保存してIDを返す", async () => {
    insertReturning.mockResolvedValue([
      { ...routeWithoutCache, status: "draft" },
    ]);
    await expect(createCaller().createDraft({ points })).resolves.toEqual({
      id: 1,
    });
    expect(insertValues).toHaveBeenCalledWith({
      title: "2026/11/11のルート",
      points: JSON.stringify(points),
      createdById: "owner",
      status: "draft",
    });
    expect(computeRoute).toHaveBeenCalledOnce();
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ distanceMeters: 1500 }),
    );
  });

  it("経路取得に失敗しても下書きのIDを返す", async () => {
    failAfterRequest(new TRPCError({ code: "INTERNAL_SERVER_ERROR" }));
    await expect(createCaller().createDraft({ points })).resolves.toEqual({
      id: 1,
    });
    expect(updateSet).not.toHaveBeenCalled();
  });

  it("仮名の日付はサーバーのタイムゾーンに依存せず日本時間で付ける", async () => {
    vi.setSystemTime(new Date("2026-11-11T16:00:00Z"));
    await createCaller().createDraft({ points });
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ title: "2026/11/12のルート" }),
    );
  });

  it("登録行が返らない場合は失敗する", async () => {
    insertReturning.mockResolvedValue([]);
    await expect(createCaller().createDraft({ points })).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
    expect(computeRoute).not.toHaveBeenCalled();
  });

  it("地点だけを変え、名前と状態を保持して経路を再計算する", async () => {
    const nextPoints = [...points, { lat: 37, lng: 137 }];
    await createCaller().updatePoints({ id: 1, points: nextPoints });
    expect(updateSet).toHaveBeenNthCalledWith(1, {
      points: JSON.stringify(nextPoints),
      updatedAt: now,
      ...emptyCache,
    });
    expect(updateWhere).toHaveBeenCalledWith(
      and(eq(routes.id, 1), eq(routes.createdById, "owner")),
    );
    expect(computeRoute).toHaveBeenCalledOnce();
  });

  it("同じ地点なら更新も経路計算もしない", async () => {
    await createCaller().updatePoints({ id: 1, points });
    expect(updateSet).not.toHaveBeenCalled();
    expect(computeRoute).not.toHaveBeenCalled();
  });

  it("地点更新の経路取得に失敗しても、変更地点とキャッシュ無効化は保存する", async () => {
    failAfterRequest(new TRPCError({ code: "INTERNAL_SERVER_ERROR" }));
    const nextPoints = [...points, { lat: 37, lng: 137 }];
    await expect(
      createCaller().updatePoints({ id: 1, points: nextPoints }),
    ).resolves.toBeUndefined();
    expect(updateSet).toHaveBeenCalledExactlyOnceWith({
      points: JSON.stringify(nextPoints),
      updatedAt: now,
      ...emptyCache,
    });
  });

  it.each(["updatePoints", "complete"] as const)(
    "%sはロック取得後の更新0件もNOT_FOUNDにする",
    async (operation) => {
      lock.mockResolvedValue([{ ...routeWithCache, status: "draft" }]);
      updateWhere.mockReturnValue({ returning: vi.fn().mockResolvedValue([]) });
      const caller = createCaller();
      await expect(
        operation === "complete"
          ? caller.complete({ id: 1 })
          : caller.updatePoints({
              id: 1,
              points: [...points, { lat: 37, lng: 137 }],
            }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(computeRoute).not.toHaveBeenCalled();
    },
  );

  it("名前だけを更新し、状態と経路は変えない", async () => {
    await createCaller().updateDetails({ id: 1, title: "  新しい名前  " });
    expect(updateSet).toHaveBeenCalledExactlyOnceWith({
      title: "新しい名前",
      updatedAt: now,
    });
    expect(updateWhere).toHaveBeenCalledWith(
      and(eq(routes.id, 1), eq(routes.createdById, "owner")),
    );
    expect(computeRoute).not.toHaveBeenCalled();
  });

  it("下書きを完了にし、完了済みなら更新しない", async () => {
    lock.mockResolvedValueOnce([{ ...routeWithCache, status: "draft" }]);
    await createCaller().complete({ id: 1 });
    expect(updateSet).toHaveBeenCalledExactlyOnceWith({
      status: "completed",
      updatedAt: now,
    });
    expect(updateWhere).toHaveBeenCalledWith(
      and(eq(routes.id, 1), eq(routes.createdById, "owner")),
    );
    await createCaller().complete({ id: 1 });
    expect(updateSet).toHaveBeenCalledOnce();
    expect(computeRoute).not.toHaveBeenCalled();
  });

  it("下書きの詳細にも状態と保存済みの距離を返す", async () => {
    lock.mockResolvedValue([{ ...routeWithCache, status: "draft" }]);
    await expect(createCaller().getById({ id: 1 })).resolves.toMatchObject({
      status: "draft",
      direction: { distanceMeters: 1200 },
    });
    expect(computeRoute).not.toHaveBeenCalled();
  });

  it("経路のない下書きを取得すると再計算する", async () => {
    lock.mockResolvedValue([{ ...routeWithoutCache, status: "draft" }]);
    await expect(createCaller().getById({ id: 1 })).resolves.toMatchObject({
      status: "draft",
      direction: { distanceMeters: 1500 },
    });
    expect(computeRoute).toHaveBeenCalledOnce();
  });

  it("下書き一覧は本人とdraftで絞り、未更新なら作成日時で並べる", async () => {
    const orderBy = vi.fn().mockResolvedValue([]);
    selectWhere.mockReturnValue({ orderBy });
    await expect(createCaller("other").getDrafts()).resolves.toEqual([]);
    expect(selectWhere).toHaveBeenCalledWith(
      and(eq(routes.createdById, "other"), eq(routes.status, "draft")),
    );
    expect(orderBy).toHaveBeenCalledWith(
      desc(sql`coalesce(${routes.updatedAt}, ${routes.createdAt})`),
      desc(routes.id),
    );
  });

  it.each(["updatePoints", "updateDetails", "complete"] as const)(
    "%sは他人のルートをNOT_FOUNDとして扱う",
    async (operation) => {
      lock.mockResolvedValue([]);
      updateWhere.mockReturnValue({ returning: vi.fn().mockResolvedValue([]) });
      const caller = createCaller("other");
      const pending =
        operation === "updatePoints"
          ? caller.updatePoints({ id: 1, points })
          : operation === "updateDetails"
            ? caller.updateDetails({ id: 1, title: "別人" })
            : caller.complete({ id: 1 });
      await expect(pending).rejects.toMatchObject({ code: "NOT_FOUND" });
      const where = operation === "updateDetails" ? updateWhere : selectWhere;
      expect(where).toHaveBeenCalledWith(
        and(eq(routes.id, 1), eq(routes.createdById, "other")),
      );
      expect(computeRoute).not.toHaveBeenCalled();
    },
  );

  it("新しいAPIはすべてログインを要求する", async () => {
    const caller = createCaller(null);
    await Promise.all(
      [
        caller.createDraft({ points }),
        caller.updatePoints({ id: 1, points }),
        caller.updateDetails({ id: 1, title: "名前" }),
        caller.complete({ id: 1 }),
        caller.getDrafts(),
      ].map((pending) =>
        expect(pending).rejects.toMatchObject({ code: "UNAUTHORIZED" }),
      ),
    );
    expect(select).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});

describe("route.delete", () => {
  it("自分のルートはIDと所有者の両方を条件に削除する", async () => {
    removeWhere.mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: 1 }]),
    });

    await expect(createCaller().delete({ id: 1 })).resolves.toBeUndefined();

    expect(remove).toHaveBeenCalledWith(routes);
    expect(removeWhere).toHaveBeenCalledWith(
      and(eq(routes.id, 1), eq(routes.createdById, "owner")),
    );
  });

  it("他人のルートは所有者条件で削除せず NOT_FOUND を返す", async () => {
    removeWhere.mockReturnValue({ returning: vi.fn().mockResolvedValue([]) });

    await expect(createCaller("other").delete({ id: 1 })).rejects.toMatchObject(
      { code: "NOT_FOUND" },
    );
    expect(removeWhere).toHaveBeenCalledWith(
      and(eq(routes.id, 1), eq(routes.createdById, "other")),
    );
    expect(removeWhere).toHaveBeenCalledOnce();
  });

  it("存在しないルートは NOT_FOUND を返す", async () => {
    removeWhere.mockReturnValue({ returning: vi.fn().mockResolvedValue([]) });

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

describe("route.createDraft", () => {
  it("27地点を受け入れて保存・計算する", async () => {
    const limitPoints = Array.from({ length: 27 }, (_, index) => ({
      lat: 35 + index / 100,
      lng: 135,
    }));
    insertReturning.mockResolvedValue([
      { ...routeWithoutCache, points: JSON.stringify(limitPoints) },
    ]);
    await expect(
      createCaller().createDraft({ points: limitPoints }),
    ).resolves.toEqual({ id: 1 });
    expect(insertValues).toHaveBeenCalledWith({
      title: "2026/11/11のルート",
      status: "draft",
      points: JSON.stringify(limitPoints),
      createdById: "owner",
    });
    expect(computeRoute).toHaveBeenCalledExactlyOnceWith(
      { routePoints: limitPoints },
      expect.any(Function),
    );
  });

  it("28地点は入力検証で拒否し、DB変更・経路計算を行わない", async () => {
    const tooManyPoints = Array.from({ length: 28 }, (_, index) => ({
      lat: 35 + index / 100,
      lng: 135,
    }));
    await expect(
      createCaller().createDraft({ points: tooManyPoints }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(transaction).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(computeRoute).not.toHaveBeenCalled();
    expect(incrementQuota).not.toHaveBeenCalled();
  });

  it("クライアントの計算結果を使わず、サーバーで計算して保存する", async () => {
    lock.mockResolvedValue([routeWithoutCache]);
    const input = {
      title: "朝のルート",
      points,
      encodedPolyline: "forged-line",
      distanceMeters: 1,
      directionSource: "routes_api",
    };
    await expect(createCaller().createDraft(input)).resolves.toEqual({ id: 1 });
    expect(insertValues).toHaveBeenCalledWith({
      title: "2026/11/11のルート",
      status: "draft",
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
    await expect(createCaller().createDraft({ points })).resolves.toEqual({
      id: 1,
    });
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
    await expect(createCaller().createDraft({ points })).resolves.toEqual({
      id: 1,
    });
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
      createCaller(null).createDraft({ points }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(transaction).not.toHaveBeenCalled();
    expect(computeRoute).not.toHaveBeenCalled();
  });

  it("DBへの作成失敗を成功として返さない", async () => {
    insertReturning.mockRejectedValue(new Error("db failed"));
    await expect(createCaller().createDraft({ points })).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
    expect(computeRoute).not.toHaveBeenCalled();
  });
});

describe("route.updatePoints", () => {
  it("27地点を受け入れて保存・計算する", async () => {
    const limitPoints = Array.from({ length: 27 }, (_, index) => ({
      lat: 35 + index / 100,
      lng: 135,
    }));
    await expect(
      createCaller().updatePoints({ ...updateInput, points: limitPoints }),
    ).resolves.toBeUndefined();
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ points: JSON.stringify(limitPoints) }),
    );
    expect(computeRoute).toHaveBeenCalledExactlyOnceWith(
      { routePoints: limitPoints },
      expect.any(Function),
    );
  });

  it("28地点は入力検証で拒否し、DB変更・経路計算を行わない", async () => {
    const tooManyPoints = Array.from({ length: 28 }, (_, index) => ({
      lat: 35 + index / 100,
      lng: 135,
    }));
    await expect(
      createCaller().updatePoints({ ...updateInput, points: tooManyPoints }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(transaction).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(computeRoute).not.toHaveBeenCalled();
    expect(incrementQuota).not.toHaveBeenCalled();
  });

  it.each([routeWithCache, routeWithoutCache])(
    "タイトルだけの変更では保存値の有無によらず再計算しない（%#）",
    async (existing) => {
      lock.mockResolvedValue([existing]);
      const input = {
        id: 1,
        title: "夕方のルート",
        encodedPolyline: "forged-line",
        directionPointsHash: "forged-hash",
      };
      await expect(
        createCaller().updateDetails(input),
      ).resolves.toBeUndefined();
      expect(updateSet).toHaveBeenCalledExactlyOnceWith({
        title: input.title,
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
      createCaller().updatePoints({ ...updateInput, points: changed }),
    ).resolves.toBeUndefined();
    expect(updateSet).toHaveBeenNthCalledWith(1, {
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
      createCaller().updatePoints({ ...updateInput, points: changed }),
    ).resolves.toBeUndefined();
    expect(updateSet).toHaveBeenCalledExactlyOnceWith({
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
      createCaller("other").updatePoints(updateInput),
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
      createCaller().updatePoints({ ...updateInput, id: 999 }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(selectWhere).toHaveBeenCalledWith(
      and(eq(routes.id, 999), eq(routes.createdById, "owner")),
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("更新0件を成功として返さない", async () => {
    updateWhere.mockReturnValue({ returning: vi.fn().mockResolvedValue([]) });
    await expect(
      createCaller().updatePoints({
        ...updateInput,
        points: [...points].reverse(),
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(computeRoute).not.toHaveBeenCalled();
  });

  it("未ログインでは更新しない", async () => {
    await expect(
      createCaller(null).updatePoints(updateInput),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(transaction).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});

describe.each(["createDraft", "updatePoints"] as const)(
  "route.%s の座標検証",
  (operation) => {
    it.each([
      { lat: -90.001, lng: 0 },
      { lat: 90.001, lng: 0 },
      { lat: 0, lng: -180.001 },
      { lat: 0, lng: 180.001 },
      { lat: Infinity, lng: 0 },
      { lat: -Infinity, lng: 0 },
      { lat: 0, lng: Infinity },
      { lat: 0, lng: -Infinity },
      { lat: NaN, lng: 0 },
      { lat: 0, lng: NaN },
    ])(
      "不正な座標をBAD_REQUESTにし、保存・通信・計上を行わない（%j）",
      async (point) => {
        await expect(
          createCaller()[operation]({
            id: 1,
            points: [point, { lat: 0, lng: 0 }],
          }),
        ).rejects.toMatchObject({ code: "BAD_REQUEST" });
        expect(transaction).not.toHaveBeenCalled();
        expect(insert).not.toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
        expect(computeRoute).not.toHaveBeenCalled();
        expect(incrementQuota).not.toHaveBeenCalled();
      },
    );

    it("境界値の地点を保存し、経路計算に渡す", async () => {
      const boundaryPoints = [
        { lat: -90, lng: -180 },
        { lat: 90, lng: 180 },
      ];
      insertReturning.mockResolvedValue([
        { ...routeWithoutCache, points: JSON.stringify(boundaryPoints) },
      ]);
      const result = await createCaller()[operation]({
        id: 1,
        points: boundaryPoints,
      });
      if (operation === "createDraft") expect(result).toEqual({ id: 1 });
      else expect(result).toBeUndefined();
      expect(
        operation === "createDraft" ? insertValues : updateSet,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ points: JSON.stringify(boundaryPoints) }),
      );
      expect(computeRoute).toHaveBeenCalledExactlyOnceWith(
        { routePoints: boundaryPoints },
        expect.any(Function),
      );
      expect(incrementQuota).toHaveBeenCalledOnce();
    });
  },
);
