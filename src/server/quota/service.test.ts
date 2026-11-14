import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkQuota,
  hasQuotaRemaining,
  incrementQuota,
} from "~/server/quota/service";

const fixedDate = new Date("2026-07-08T12:00:00.000Z");

const createDbMock = (existing: { count: number } | null) => {
  const findFirst = vi.fn().mockResolvedValue(existing);
  const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
  const values = vi.fn(() => ({ onConflictDoUpdate }));
  const insert = vi.fn(() => ({ values }));

  return {
    db: {
      query: {
        quotaUsages: {
          findFirst,
        },
      },
      insert,
    } as never,
    mocks: {
      findFirst,
      values,
      insert,
      onConflictDoUpdate,
    },
  };
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(fixedDate);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("checkQuota", () => {
  it("当日の利用回数が上限未満ならエラーを投げない", async () => {
    const { db, mocks } = createDbMock({ count: 49 });

    await expect(
      checkQuota(db, "user-1", "direction"),
    ).resolves.toBeUndefined();

    expect(mocks.findFirst).toHaveBeenCalledTimes(1);
  });

  it("当日の利用回数が上限以上なら TOO_MANY_REQUESTS を投げる", async () => {
    const { db } = createDbMock({ count: 50 });

    await expect(checkQuota(db, "user-1", "direction")).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
      message: "QUOTA_EXCEEDED",
    });
  });
});

describe("hasQuotaRemaining", () => {
  it.each([
    [null, true],
    [{ count: 49 }, true],
    [{ count: 50 }, false],
    [{ count: 51 }, false],
  ])("利用回数 %s の上限判定は %s", async (existing, expected) => {
    const { db } = createDbMock(existing);
    await expect(hasQuotaRemaining(db, "user-1", "direction")).resolves.toBe(
      expected,
    );
  });

  it("DB障害を伝播する", async () => {
    const { db, mocks } = createDbMock(null);
    const error = new Error("database error");
    mocks.findFirst.mockRejectedValue(error);
    await expect(hasQuotaRemaining(db, "user-1", "direction")).rejects.toBe(
      error,
    );
  });
});

describe("incrementQuota", () => {
  it("当日分を検索せず UPSERT する", async () => {
    const { db, mocks } = createDbMock(null);
    await incrementQuota(db, "user-1", "direction");
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.values).toHaveBeenCalledWith({
      userId: "user-1",
      feature: "direction",
      date: "2026-07-08",
      count: 1,
    });
    expect(mocks.onConflictDoUpdate).toHaveBeenCalledOnce();
  });

  it("DB障害を伝播する", async () => {
    const { db, mocks } = createDbMock(null);
    const error = new Error("database error");
    mocks.onConflictDoUpdate.mockRejectedValue(error);
    await expect(incrementQuota(db, "user-1", "direction")).rejects.toBe(error);
  });
});
