import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { userRouter } from "./user";

const { findFirst, update, set, where } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn(),
  set: vi.fn<(values: Partial<typeof users.$inferInsert>) => unknown>(),
  where: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({
  db: { query: { users: { findFirst } }, update },
}));

const columns = {
  id: true,
  name: true,
  email: true,
  image: true,
  birthDate: true,
  gender: true,
  pace: true,
  height: true,
  weight: true,
  profileCompletedAt: true,
};
const profile = {
  id: "owner",
  name: "Runner",
  email: "runner@example.test",
  image: null,
  birthDate: "2000-01-01",
  gender: "other",
  pace: "5:00",
  height: 170,
  weight: 60,
  profileCompletedAt: null,
};
const initialInput = {
  birthDate: "2000-01-01",
  gender: "other",
  pace: "5:00",
  height: 170,
  weight: 60,
};

function createCaller(userId: string | null = "owner") {
  return userRouter.createCaller({
    db,
    headers: new Headers(),
    session: userId
      ? { user: { id: userId, role: "user" }, expires: "2099-01-01" }
      : null,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  update.mockReturnValue({ set });
  set.mockReturnValue({ where });
  where.mockResolvedValue(undefined);
  findFirst.mockResolvedValue(profile);
});
afterEach(() => vi.useRealTimers());

describe("user router", () => {
  it("本人のプロフィールを指定した列で取得し、存在しなければ null を返す", async () => {
    expect(await createCaller().getCurrent()).toEqual(profile);
    expect(findFirst).toHaveBeenCalledWith({
      where: eq(users.id, "owner"),
      columns,
    });
    findFirst.mockResolvedValueOnce(undefined);
    expect(await createCaller().getCurrent()).toBeNull();
  });

  it("部分更新は本人だけを対象にし、省略した列を SQL に含めない", async () => {
    expect(await createCaller().updateProfile({ height: 175 })).toEqual(
      profile,
    );
    expect(update).toHaveBeenCalledWith(users);
    expect(where).toHaveBeenCalledWith(eq(users.id, "owner"));
    expect(findFirst).toHaveBeenCalledWith({
      where: eq(users.id, "owner"),
      columns,
    });
    expect(set).toHaveBeenCalledWith({
      birthDate: undefined,
      gender: undefined,
      pace: undefined,
      height: 175,
      weight: undefined,
    });
    const values = set.mock.calls[0]?.[0];
    if (!values) throw new Error("set was not called");
    const query = drizzle
      .mock()
      .update(users)
      .set(values)
      .where(eq(users.id, "owner"))
      .toSQL();
    expect(query.sql).toMatch(/set "height" = \$1 where/);
    expect(query.params).toEqual([175, "owner"]);
    findFirst.mockResolvedValueOnce(undefined);
    expect(await createCaller().updateProfile({ weight: 65 })).toBeUndefined();
  });

  it("明示的な undefined を除き、指定された全項目を更新する", async () => {
    await createCaller().updateProfile({ ...initialInput, gender: undefined });
    const values = set.mock.calls[0]?.[0];
    if (!values) throw new Error("set was not called");
    const query = drizzle
      .mock()
      .update(users)
      .set(values)
      .where(eq(users.id, "owner"))
      .toSQL();
    expect(query.sql).not.toContain('"gender"');
    expect(query.params).toEqual(["2000-01-01", "5:00", 170, 60, "owner"]);

    await createCaller().updateProfile(initialInput);
    const allValues = set.mock.calls[1]?.[0];
    if (!allValues) throw new Error("set was not called twice");
    const allQuery = drizzle
      .mock()
      .update(users)
      .set(allValues)
      .where(eq(users.id, "owner"))
      .toSQL();
    expect(allQuery.params).toEqual([
      "2000-01-01",
      "other",
      "5:00",
      170,
      60,
      "owner",
    ]);
  });

  it("初期設定を本人に保存し完了日時と指定列を返す", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const now = new Date("2026-11-14T00:00:00Z");
    vi.setSystemTime(now);
    expect(await createCaller().completeInitialProfile(initialInput)).toEqual(
      profile,
    );
    expect(set).toHaveBeenCalledWith({
      ...initialInput,
      profileCompletedAt: now,
    });
    expect(where).toHaveBeenCalledWith(eq(users.id, "owner"));
    expect(findFirst).toHaveBeenCalledWith({
      where: eq(users.id, "owner"),
      columns,
    });
    findFirst.mockResolvedValueOnce(undefined);
    expect(
      await createCaller().completeInitialProfile(initialInput),
    ).toBeUndefined();
  });

  it("各操作の取得と更新はセッションのユーザー ID を使う", async () => {
    const caller = createCaller("another-user");
    await caller.getCurrent();
    await caller.updateProfile({ height: 175 });
    await caller.completeInitialProfile(initialInput);
    expect(findFirst).toHaveBeenCalledTimes(3);
    for (const call of findFirst.mock.calls) {
      expect(call[0]).toEqual({ where: eq(users.id, "another-user"), columns });
    }
    expect(where).toHaveBeenCalledTimes(2);
    expect(where).toHaveBeenNthCalledWith(1, eq(users.id, "another-user"));
    expect(where).toHaveBeenNthCalledWith(2, eq(users.id, "another-user"));
  });

  it("DB 障害を伝播し、更新失敗後は取得しない", async () => {
    const error = new Error("database failure");
    findFirst.mockRejectedValueOnce(error);
    await expect(createCaller().getCurrent()).rejects.toThrow(
      "database failure",
    );
    findFirst.mockClear();
    where.mockRejectedValueOnce(error);
    await expect(createCaller().updateProfile({ height: 175 })).rejects.toThrow(
      "database failure",
    );
    expect(findFirst).not.toHaveBeenCalled();
    where.mockRejectedValueOnce(error);
    await expect(
      createCaller().completeInitialProfile(initialInput),
    ).rejects.toThrow("database failure");
    expect(findFirst).not.toHaveBeenCalled();
    findFirst.mockRejectedValueOnce(error);
    await expect(createCaller().updateProfile({ height: 175 })).rejects.toThrow(
      "database failure",
    );
  });

  it("未認証では全操作を拒否する", async () => {
    const caller = createCaller(null);
    await expect(caller.getCurrent()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(caller.updateProfile({ height: 175 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(
      caller.completeInitialProfile(initialInput),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(update).not.toHaveBeenCalled();
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("不正な入力を拒否し DB を更新しない", async () => {
    await expect(createCaller().updateProfile({})).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(
      createCaller().updateProfile({ height: 0 }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      createCaller().completeInitialProfile({
        ...initialInput,
        birthDate: "invalid",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(update).not.toHaveBeenCalled();
  });
});
