import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkQuota, incrementQuota } from "~/server/quota/service";

const fixedDate = new Date("2026-07-08T12:00:00.000Z");

const createDbMock = (existing: { count: number } | null) => {
  const findFirst = vi.fn().mockResolvedValue(existing);
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  const values = vi.fn().mockResolvedValue(undefined);
  const insert = vi.fn(() => ({ values }));

  return {
    db: {
      query: {
        quotaUsages: {
          findFirst,
        },
      },
      update,
      insert,
    } as never,
    mocks: {
      findFirst,
      where,
      set,
      update,
      values,
      insert,
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

describe("incrementQuota", () => {
  it("既存レコードがあれば update を呼ぶ", async () => {
    const { db, mocks } = createDbMock({ count: 10 });

    await incrementQuota(db, "user-1", "direction");

    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.set).toHaveBeenCalledTimes(1);
    expect(mocks.where).toHaveBeenCalledTimes(1);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("既存レコードがなければ当日分を insert する", async () => {
    const { db, mocks } = createDbMock(null);

    await incrementQuota(db, "user-1", "direction");

    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.values).toHaveBeenCalledWith({
      userId: "user-1",
      feature: "direction",
      date: "2026-07-08",
      count: 1,
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
