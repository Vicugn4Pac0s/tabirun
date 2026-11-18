import type * as ProfileModule from "~/server/features/user/service";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SetupProfilePage from "./page";
const { auth, getUserProfileSettings, redirect, screenProps } = vi.hoisted(
  () => ({
    auth: vi.fn(),
    getUserProfileSettings: vi.fn(),
    screenProps: vi.fn(),
    redirect: vi.fn((path: string) => {
      throw new Error(`REDIRECT:${path}`);
    }),
  }),
);
vi.mock("~/server/auth", () => ({ auth }));
vi.mock("server-only", () => ({}));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/features/user/service", async (importOriginal) => ({
  ...(await importOriginal<typeof ProfileModule>()),
  getUserProfileSettings,
}));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("~/frontend/features/user/components/UserInitialProfileScreen", () => ({
  UserInitialProfileScreen: (props: unknown) => {
    screenProps(props);
    return <h1>初期設定</h1>;
  },
}));
beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "owner" } });
  getUserProfileSettings.mockResolvedValue({ profileCompletedAt: null });
});
afterEach(cleanup);
describe("SetupProfilePage", () => {
  it("未ログインなら現在のページでログインを案内する", async () => {
    auth.mockResolvedValue(null);
    render(await SetupProfilePage());
    expect(
      screen.getByRole("heading", { name: "ログインが必要です" }),
    ).toBeInTheDocument();
    expect(getUserProfileSettings).not.toHaveBeenCalled();
  });
  it("未設定なら初回設定を表示する", async () => {
    render(await SetupProfilePage());
    expect(
      screen.getByRole("heading", { name: "初期設定" }),
    ).toBeInTheDocument();
  });
  it("設定完了後の再取得では従来どおりホームへ戻す", async () => {
    getUserProfileSettings.mockResolvedValue({
      profileCompletedAt: new Date(),
    });
    await expect(SetupProfilePage()).rejects.toThrow("REDIRECT:/");
    expect(redirect).toHaveBeenCalledWith("/");
  });
  it("DBの選択肢外の性別を未選択としてフォームへ渡す", async () => {
    getUserProfileSettings.mockResolvedValue({
      profileCompletedAt: null,
      gender: "invalid",
    });
    render(await SetupProfilePage());
    expect(
      screen.getByRole("heading", { name: "初期設定" }),
    ).toBeInTheDocument();
    expect(screenProps).toHaveBeenCalledWith({
      initialValues: {
        birthDate: undefined,
        gender: undefined,
        pace: undefined,
        height: undefined,
        weight: undefined,
      },
    });
  });
});
