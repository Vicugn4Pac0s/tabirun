import type * as ProfileModule from "~/server/features/user/service";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "~/server/db";
import { getProtectedPageState } from "./getProtectedPageState";

const { auth, getUserProfileSettings } = vi.hoisted(() => ({
  auth: vi.fn(),
  getUserProfileSettings: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("~/server/auth", () => ({ auth }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/features/user/service", async (importOriginal) => ({
  ...(await importOriginal<typeof ProfileModule>()),
  getUserProfileSettings,
}));

const session = { user: { id: "owner" }, expires: "2099-01-01" };
const profile = {
  profileCompletedAt: new Date("2026-01-01"),
  birthDate: "1990-01-01",
  gender: "male",
  pace: "6:00",
  height: 170,
  weight: 60,
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue(session);
  getUserProfileSettings.mockResolvedValue(profile);
});

describe("getProtectedPageState", () => {
  it.each([null, { user: {} }, { user: { id: "" } }])(
    "ユーザーIDがなければ未ログインとし、プロフィールを取得しない（%j）",
    async (value) => {
      auth.mockResolvedValue(value);
      await expect(getProtectedPageState()).resolves.toEqual({
        status: "unauthenticated",
      });
      expect(getUserProfileSettings).not.toHaveBeenCalled();
    },
  );

  it("初期設定前は保存値をフォーム初期値にして返す", async () => {
    getUserProfileSettings.mockResolvedValue({
      ...profile,
      profileCompletedAt: null,
    });
    await expect(getProtectedPageState()).resolves.toEqual({
      status: "profileRequired",
      initialValues: {
        birthDate: "1990-01-01",
        gender: "male",
        pace: "6:00",
        height: 170,
        weight: 60,
      },
    });
    expect(getUserProfileSettings).toHaveBeenCalledExactlyOnceWith(db, "owner");
  });

  it("未設定項目と選択肢外の性別は未入力の初期値にする", async () => {
    getUserProfileSettings.mockResolvedValue({
      profileCompletedAt: null,
      birthDate: null,
      gender: "invalid",
      pace: null,
      height: null,
      weight: null,
    });
    await expect(getProtectedPageState()).resolves.toEqual({
      status: "profileRequired",
      initialValues: {
        birthDate: undefined,
        gender: undefined,
        pace: undefined,
        height: undefined,
        weight: undefined,
      },
    });
  });

  it("初期設定済みならセッションとプロフィールを返す", async () => {
    await expect(getProtectedPageState()).resolves.toEqual({
      status: "ready",
      session,
      user: profile,
    });
  });

  it("プロフィール行がなくてもページ本体へ進める状態を返す", async () => {
    getUserProfileSettings.mockResolvedValue(undefined);
    await expect(getProtectedPageState()).resolves.toEqual({
      status: "ready",
      session,
      user: undefined,
    });
  });

  it("プロフィールのDB障害を状態に変換せず伝播する", async () => {
    const error = new Error("database failure");
    getUserProfileSettings.mockRejectedValue(error);
    await expect(getProtectedPageState()).rejects.toBe(error);
  });
});
