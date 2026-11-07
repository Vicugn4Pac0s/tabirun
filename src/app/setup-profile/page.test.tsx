import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SetupProfilePage from "./page";
const { auth, getUserProfileSettings, redirect } = vi.hoisted(() => ({
  auth: vi.fn(),
  getUserProfileSettings: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
vi.mock("~/server/auth", () => ({ auth }));
vi.mock("~/server/features/user/queries", () => ({ getUserProfileSettings }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("~/frontend/features/user/components/UserInitialProfileScreen", () => ({
  UserInitialProfileScreen: () => <h1>初期設定</h1>,
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
});
