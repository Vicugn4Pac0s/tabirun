import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./page";
const { auth, getUserHomePageSettings, redirect } = vi.hoisted(() => ({
  auth: vi.fn(),
  getUserHomePageSettings: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
vi.mock("~/server/auth", () => ({ auth }));
vi.mock("~/server/features/user/queries", () => ({ getUserHomePageSettings }));
vi.mock("next/navigation", () => ({ redirect }));
const openPage = (returnTo: string | string[] = "/routes/12/edit") =>
  LoginPage({ searchParams: Promise.resolve({ returnTo }) });
beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue(null);
  getUserHomePageSettings.mockResolvedValue({ profileCompletedAt: new Date() });
});
afterEach(cleanup);
describe("LoginPage", () => {
  it("未ログインならログインが必要な案内を出す", async () => {
    render(await openPage());
    expect(
      screen.getByRole("heading", { name: "ログインが必要です" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Googleでログイン" }),
    ).toBeEnabled();
    expect(getUserHomePageSettings).not.toHaveBeenCalled();
  });
  it("ログイン済みなら元ページへ戻す", async () => {
    auth.mockResolvedValue({ user: { id: "owner" } });
    await expect(openPage()).rejects.toThrow("REDIRECT:/routes/12/edit");
  });
  it("未設定なら元ページを保持して初回設定へ送る", async () => {
    auth.mockResolvedValue({ user: { id: "owner" } });
    getUserHomePageSettings.mockResolvedValue({ profileCompletedAt: null });
    await expect(openPage()).rejects.toThrow(
      "REDIRECT:/setup-profile?returnTo=%2Froutes%2F12%2Fedit",
    );
  });
  it("外部URLを戻り先に使わない", async () => {
    auth.mockResolvedValue({ user: { id: "owner" } });
    await expect(openPage("https://example.com")).rejects.toThrow("REDIRECT:/");
    expect(redirect).toHaveBeenCalledWith("/");
  });
});
