import { beforeEach, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { routes } from "~/server/db/schema";
import { routeRouter } from "./route";

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("~/server/db", () => ({
  db: { query: { routes: { findFirst } } },
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

beforeEach(() => vi.resetAllMocks());

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
