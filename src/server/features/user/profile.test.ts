import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { getUserHomePageSettings, getUserProfileSettings } from "./profile";

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("~/server/db", () => ({ db: { query: { users: { findFirst } } } }));
beforeEach(() => vi.resetAllMocks());

describe("プロフィール設定の読み取り", () => {
  it("ホーム用は渡されたDBで本人の完了状態だけを取得する", async () => {
    const settings = { profileCompletedAt: new Date() };
    findFirst.mockResolvedValue(settings);
    await expect(getUserHomePageSettings(db, "owner")).resolves.toEqual(
      settings,
    );
    expect(findFirst).toHaveBeenCalledExactlyOnceWith({
      where: eq(users.id, "owner"),
      columns: { profileCompletedAt: true },
    });
  });

  it("プロフィール画面用は渡されたDBで本人の設定項目だけを取得する", async () => {
    const settings = {
      profileCompletedAt: null,
      birthDate: null,
      gender: null,
      pace: null,
      height: null,
      weight: null,
    };
    findFirst.mockResolvedValue(settings);
    await expect(getUserProfileSettings(db, "other-user")).resolves.toEqual(
      settings,
    );
    expect(findFirst).toHaveBeenCalledExactlyOnceWith({
      where: eq(users.id, "other-user"),
      columns: {
        profileCompletedAt: true,
        birthDate: true,
        gender: true,
        pace: true,
        height: true,
        weight: true,
      },
    });
  });

  it.each([getUserHomePageSettings, getUserProfileSettings])(
    "対象がなければundefinedを返す（%#）",
    async (read) => {
      findFirst.mockResolvedValue(undefined);
      await expect(read(db, "missing")).resolves.toBeUndefined();
      expect(findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: eq(users.id, "missing") }),
      );
    },
  );

  it.each([getUserHomePageSettings, getUserProfileSettings])(
    "DBの失敗を対象なしに変換しない（%#）",
    async (read) => {
      const error = new Error("DB unavailable");
      findFirst.mockRejectedValue(error);
      await expect(read(db, "owner")).rejects.toThrow(error);
    },
  );
});
