import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import RouteCreatePage from "./page";
const { auth, getUserHomePageSettings, screenProps, redirect } = vi.hoisted(
  () => ({
    auth: vi.fn(),
    getUserHomePageSettings: vi.fn(),
    screenProps: vi.fn(),
    redirect: vi.fn((path: string) => {
      throw new Error(`REDIRECT:${path}`);
    }),
  }),
);
vi.mock("~/server/auth", () => ({ auth }));
vi.mock("~/server/features/user/queries", () => ({ getUserHomePageSettings }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("~/frontend/features/route/components/RouteCreateScreen", () => ({
  RouteCreateScreen: (props: { defaultCenter: google.maps.LatLngLiteral }) => {
    screenProps(props);
    return <h1>ルートを作成</h1>;
  },
}));
beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "owner" } });
  getUserHomePageSettings.mockResolvedValue({
    profileCompletedAt: new Date(),
    homeLat: 35,
    homeLng: 135,
  });
});
afterEach(cleanup);
describe("RouteCreatePage", () => {
  it("ユーザー設定の位置で作成画面を開く", async () => {
    render(await RouteCreatePage());
    expect(
      screen.getByRole("heading", { name: "ルートを作成" }),
    ).toBeInTheDocument();
    expect(screenProps).toHaveBeenCalledWith({
      defaultCenter: { lat: 35, lng: 135 },
    });
  });
  it("初期位置未設定では既定位置を使う", async () => {
    getUserHomePageSettings.mockResolvedValue({
      profileCompletedAt: new Date(),
      homeLat: null,
      homeLng: null,
    });
    render(await RouteCreatePage());
    expect(screenProps).toHaveBeenCalledWith({
      defaultCenter: GOOGLE_MAP_DEFAULT_CENTER,
    });
  });
  it("未ログインではホームへ戻す", async () => {
    auth.mockResolvedValue(null);
    await expect(RouteCreatePage()).rejects.toThrow("REDIRECT:/");
    expect(getUserHomePageSettings).not.toHaveBeenCalled();
  });
  it("プロフィール未登録では設定へ戻す", async () => {
    getUserHomePageSettings.mockResolvedValue({ profileCompletedAt: null });
    await expect(RouteCreatePage()).rejects.toThrow("REDIRECT:/setup-profile");
  });
});
