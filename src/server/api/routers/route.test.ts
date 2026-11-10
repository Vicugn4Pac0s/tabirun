import { beforeEach, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { routes } from "~/server/db/schema";
import { routeRouter } from "./route";

const {
  findFirst,
  select,
  selectFrom,
  selectWhere,
  update,
  updateSet,
  updateWhere,
  remove,
  removeWhere,
} = vi.hoisted(() => ({
  findFirst: vi.fn(),
  select: vi.fn(),
  selectFrom: vi.fn(),
  selectWhere: vi.fn(),
  update: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  remove: vi.fn(),
  removeWhere: vi.fn(),
}));
vi.mock("~/server/db", () => ({
  db: {
    query: { routes: { findFirst } },
    select,
    update,
    delete: remove,
  },
}));
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));

const points = [
  { lat: 35, lng: 135 },
  { lat: 36, lng: 136 },
];
const savedRoute = {
  id: 1,
  title: "朝のルート",
  points: JSON.stringify(points),
  createdById: "owner",
  createdAt: new Date("2026-10-24T00:00:00Z"),
  updatedAt: null,
};

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
  select.mockReturnValue({ from: selectFrom });
  selectFrom.mockReturnValue({ where: selectWhere });
  update.mockReturnValue({ set: updateSet });
  updateSet.mockReturnValue({ where: updateWhere });
  remove.mockReturnValue({ where: removeWhere });
});

describe("route.getByUser", () => {
  it("経路計算結果を取得せず、既存の一覧項目だけを返す", async () => {
    selectWhere.mockResolvedValue([savedRoute]);

    await expect(createCaller().getByUser()).resolves.toEqual([
      { ...savedRoute, points },
    ]);
    expect(select).toHaveBeenCalledWith({
      id: routes.id,
      title: routes.title,
      points: routes.points,
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

  it.each(["invalid-json", JSON.stringify([{ lat: "invalid", lng: 135 }])])(
    "不正な地点データ %s は返さない",
    async (invalidPoints) => {
      selectWhere.mockResolvedValue([{ ...savedRoute, points: invalidPoints }]);

      await expect(createCaller().getByUser()).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
      });
    },
  );
});

describe("route.getById", () => {
  it("IDとログインユーザーの両方を条件に取得し、地点JSONを検証して返す", async () => {
    findFirst.mockResolvedValue(savedRoute);
    await expect(createCaller().getById({ id: 1 })).resolves.toEqual({
      ...savedRoute,
      points,
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: and(eq(routes.id, 1), eq(routes.createdById, "owner")),
    });
  });

  it("他人のルートは所有者条件で除外し、NOT_FOUNDを返す", async () => {
    findFirst.mockResolvedValue(undefined);
    await expect(
      createCaller("other").getById({ id: 1 }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(findFirst).toHaveBeenCalledWith({
      where: and(eq(routes.id, 1), eq(routes.createdById, "other")),
    });
  });

  it("存在しないIDはNOT_FOUNDを返す", async () => {
    findFirst.mockResolvedValue(undefined);
    await expect(createCaller().getById({ id: 999 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("未ログインではDBにアクセスしない", async () => {
    await expect(createCaller(null).getById({ id: 1 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5])("不正なID %s は拒否する", async (id) => {
    await expect(createCaller().getById({ id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("不正な地点データは返さない", async () => {
    findFirst.mockResolvedValue({
      ...savedRoute,
      points: JSON.stringify([{ lat: "invalid", lng: 135 }]),
    });
    await expect(createCaller().getById({ id: 1 })).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });
});

describe("route.update", () => {
  it("自分のルートはIDと所有者の両方を条件に更新する", async () => {
    updateWhere.mockResolvedValue({ count: 1 });

    await expect(createCaller().update(updateInput)).resolves.toBeUndefined();

    expect(update).toHaveBeenCalledWith(routes);
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "夕方のルート",
        points: JSON.stringify(points),
      }),
    );
    expect(updateWhere).toHaveBeenCalledWith(
      and(eq(routes.id, 1), eq(routes.createdById, "owner")),
    );
  });

  it("他人のルートは所有者条件で更新せず NOT_FOUND を返す", async () => {
    updateWhere.mockResolvedValue({ count: 0 });

    await expect(
      createCaller("other").update(updateInput),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(updateWhere).toHaveBeenCalledWith(
      and(eq(routes.id, 1), eq(routes.createdById, "other")),
    );
    expect(updateWhere).toHaveBeenCalledOnce();
  });

  it("存在しないルートは NOT_FOUND を返す", async () => {
    updateWhere.mockResolvedValue({ count: 0 });

    await expect(
      createCaller().update({ ...updateInput, id: 999 }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(updateWhere).toHaveBeenCalledWith(
      and(eq(routes.id, 999), eq(routes.createdById, "owner")),
    );
  });

  it("未ログインでは更新しない", async () => {
    await expect(createCaller(null).update(updateInput)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
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
