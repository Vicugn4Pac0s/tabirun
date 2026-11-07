import { TRPCError } from "@trpc/server";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RouteDetailPage from "./page";

const {
  auth,
  getUserProfileSettings,
  getById,
  notFound,
  redirect,
  detailScreen,
} = vi.hoisted(() => ({
  detailScreen: vi.fn(),
  auth: vi.fn(),
  getUserProfileSettings: vi.fn(),
  getById: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND_PAGE");
  }),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
vi.mock("~/frontend/features/user/components/UserInitialProfileScreen", () => ({
  UserInitialProfileScreen: () => <h1>初期設定</h1>,
}));
vi.mock("server-only", () => ({}));
vi.mock("~/frontend/features/route/components/RouteDetailScreen", () => ({
  RouteDetailScreen: ({
    route,
  }: {
    route: { title: string; points: google.maps.LatLngLiteral[] };
  }) => {
    detailScreen(route);
    return <h1>{route.title}</h1>;
  },
}));
vi.mock("~/server/auth", () => ({ auth }));
vi.mock("~/server/features/user/queries", () => ({ getUserProfileSettings }));
vi.mock("~/trpc/server", () => ({ api: { route: { getById } } }));
vi.mock("next/navigation", () => ({ notFound, redirect }));

const openPage = (id = "1") =>
  RouteDetailPage({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "owner" } });
  getUserProfileSettings.mockResolvedValue({ profileCompletedAt: new Date() });
  getById.mockResolvedValue({
    title: "朝のルート",
    points: [
      { lat: 35, lng: 135 },
      { lat: 36, lng: 136 },
    ],
  });
});
afterEach(cleanup);

describe("RouteDetailPage", () => {
  it("URLのIDから取得したルートを、選択storeなしで表示する", async () => {
    render(await openPage("123"));
    expect(getById).toHaveBeenCalledWith({ id: 123 });
    expect(
      screen.getByRole("heading", { name: "朝のルート" }),
    ).toBeInTheDocument();
    expect(detailScreen).toHaveBeenCalledWith({
      title: "朝のルート",
      points: [
        { lat: 35, lng: 135 },
        { lat: 36, lng: 136 },
      ],
    });
  });

  it("未ログインではログイン案内をその場で表示する", async () => {
    auth.mockResolvedValue(null);
    render(await openPage());
    expect(
      screen.getByRole("heading", { name: "ログインが必要です" }),
    ).toBeInTheDocument();
    expect(getById).not.toHaveBeenCalled();
  });

  it("初期プロフィール未登録なら初期設定をその場で表示する", async () => {
    getUserProfileSettings.mockResolvedValue({ profileCompletedAt: null });
    render(await openPage());
    expect(
      screen.getByRole("heading", { name: "初期設定" }),
    ).toBeInTheDocument();
    expect(getById).not.toHaveBeenCalled();
  });

  it.each(["abc", "0", "-1", "1.5", "9007199254740992"])(
    "不正なID %s は404にする",
    async (id) => {
      await expect(openPage(id)).rejects.toThrow("NOT_FOUND_PAGE");
      expect(getById).not.toHaveBeenCalled();
    },
  );

  it("未ログインでも不正IDは404にする", async () => {
    auth.mockResolvedValue(null);
    await expect(openPage("abc")).rejects.toThrow("NOT_FOUND_PAGE");
    expect(getUserProfileSettings).not.toHaveBeenCalled();
  });

  it("取得対象がなければ404にする", async () => {
    getById.mockRejectedValue(new TRPCError({ code: "NOT_FOUND" }));
    await expect(openPage()).rejects.toThrow("NOT_FOUND_PAGE");
  });

  it("取得エラーを404として隠さない", async () => {
    const error = new Error("Database unavailable");
    getById.mockRejectedValue(error);
    await expect(openPage()).rejects.toBe(error);
    expect(notFound).not.toHaveBeenCalled();
  });
});
