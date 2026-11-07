import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SetupProfilePage from "./page";
const { auth, findFirst, redirect } = vi.hoisted(() => ({
  auth: vi.fn(),
  findFirst: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
vi.mock("~/server/auth", () => ({ auth }));
vi.mock("~/server/db", () => ({ db: { query: { users: { findFirst } } } }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("~/frontend/features/user/components/UserInitialProfileScreen", () => ({
  UserInitialProfileScreen: ({ returnTo }: { returnTo: string }) => (
    <p>戻り先:{returnTo}</p>
  ),
}));
const openPage = (returnTo = "/routes/new") =>
  SetupProfilePage({ searchParams: Promise.resolve({ returnTo }) });
beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "owner" } });
  findFirst.mockResolvedValue({ profileCompletedAt: null });
});
afterEach(cleanup);
describe("SetupProfilePage", () => {
  it("未ログインなら戻り先を保持してログイン案内へ送る", async () => {
    auth.mockResolvedValue(null);
    await expect(openPage()).rejects.toThrow(
      "REDIRECT:/login?returnTo=%2Froutes%2Fnew",
    );
    expect(findFirst).not.toHaveBeenCalled();
  });
  it("未設定ならフォームへ戻り先を渡す", async () => {
    render(await openPage());
    expect(screen.getByText("戻り先:/routes/new")).toBeInTheDocument();
  });
  it("設定済みなら元ページに戻す", async () => {
    findFirst.mockResolvedValue({ profileCompletedAt: new Date() });
    await expect(openPage()).rejects.toThrow("REDIRECT:/routes/new");
  });
  it("設定済みで循環する戻り先ならホームに戻す", async () => {
    findFirst.mockResolvedValue({ profileCompletedAt: new Date() });
    await expect(openPage("/setup-profile")).rejects.toThrow("REDIRECT:/");
    expect(redirect).toHaveBeenCalledWith("/");
  });
});
