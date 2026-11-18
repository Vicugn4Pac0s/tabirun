import { db } from "~/server/db";
import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./page";

const {
  auth,
  getUserHomePageSettings,
  prefetchUser,
  prefetchRoutes,
  redirect,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  getUserHomePageSettings: vi.fn(),
  prefetchUser: vi.fn<() => Promise<void>>(),
  prefetchRoutes: vi.fn<() => Promise<void>>(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("~/server/auth", () => ({ auth }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/features/user/service", () => ({ getUserHomePageSettings }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("~/trpc/server", () => ({
  api: {
    user: { getCurrent: { prefetch: prefetchUser } },
    route: { getByUser: { prefetch: prefetchRoutes } },
  },
  HydrateClient: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("~/frontend/features/dashboard/components/Dashboard", () => ({
  Dashboard: () => <h1>ホーム</h1>,
}));

beforeEach(() => {
  vi.resetAllMocks();
  auth.mockResolvedValue({ user: { id: "owner" } });
  getUserHomePageSettings.mockResolvedValue({ profileCompletedAt: new Date() });
  prefetchUser.mockResolvedValue(undefined);
  prefetchRoutes.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("Home", () => {
  it("ログイン済みなら本人の完了状態を確認し、2件をprefetchしてホームを返す", async () => {
    render(await Home());
    expect(getUserHomePageSettings).toHaveBeenCalledExactlyOnceWith(
      db,
      "owner",
    );
    expect(prefetchUser).toHaveBeenCalledExactlyOnceWith();
    expect(prefetchRoutes).toHaveBeenCalledExactlyOnceWith();
    expect(screen.getByRole("heading", { name: "ホーム" })).toBeInTheDocument();
  });

  it("2件を並列取得し、両方の完了まで画面を返さない", async () => {
    let resolveUser: () => void = vi.fn();
    let resolveRoutes: () => void = vi.fn();
    prefetchUser.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveUser = resolve;
      }),
    );
    prefetchRoutes.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveRoutes = resolve;
      }),
    );
    let returned = false;
    const home = Home().then((element) => {
      returned = true;
      return element;
    });
    await vi.waitFor(() => {
      expect(prefetchUser).toHaveBeenCalledOnce();
      expect(prefetchRoutes).toHaveBeenCalledOnce();
    });
    expect(returned).toBe(false);
    resolveUser();
    await Promise.resolve();
    expect(returned).toBe(false);
    resolveRoutes();
    render(await home);
    expect(screen.getByRole("heading", { name: "ホーム" })).toBeInTheDocument();
  });

  it.each([null, { user: {} }])(
    "未ログイン・ユーザーIDなしでは個人データを取得しない（%j）",
    async (session) => {
      auth.mockResolvedValue(session);
      render(await Home());
      expect(getUserHomePageSettings).not.toHaveBeenCalled();
      expect(prefetchUser).not.toHaveBeenCalled();
      expect(prefetchRoutes).not.toHaveBeenCalled();
      expect(
        screen.getByRole("heading", { name: "ホーム" }),
      ).toBeInTheDocument();
    },
  );

  it("プロフィール未完了ならprefetch前に初期設定へ移動する", async () => {
    getUserHomePageSettings.mockResolvedValue({ profileCompletedAt: null });
    await expect(Home()).rejects.toThrow("REDIRECT:/setup-profile");
    expect(redirect).toHaveBeenCalledWith("/setup-profile");
    expect(prefetchUser).not.toHaveBeenCalled();
    expect(prefetchRoutes).not.toHaveBeenCalled();
  });

  it("プロフィール行がなくても従来どおりホームを返す", async () => {
    getUserHomePageSettings.mockResolvedValue(undefined);
    render(await Home());
    expect(redirect).not.toHaveBeenCalled();
    expect(prefetchUser).toHaveBeenCalledOnce();
    expect(prefetchRoutes).toHaveBeenCalledOnce();
  });

  it("完了状態の取得失敗は隠さず、prefetchを開始しない", async () => {
    const error = new Error("DB unavailable");
    getUserHomePageSettings.mockRejectedValue(error);
    await expect(Home()).rejects.toThrow(error);
    expect(prefetchUser).not.toHaveBeenCalled();
    expect(prefetchRoutes).not.toHaveBeenCalled();
  });
});
