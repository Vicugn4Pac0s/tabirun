import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import RouteCreatePage from "./page";
const { auth, getUserProfileSettings, screenProps, redirect } = vi.hoisted(
  () => ({
    auth: vi.fn(),
    getUserProfileSettings: vi.fn(),
    screenProps: vi.fn(),
    redirect: vi.fn((path: string) => {
      throw new Error(`REDIRECT:${path}`);
    }),
  }),
);
vi.mock("~/frontend/features/user/components/UserInitialProfileScreen", () => ({
  UserInitialProfileScreen: () => <h1>初期設定</h1>,
}));
vi.mock("server-only", () => ({}));
vi.mock("~/server/auth", () => ({ auth }));
vi.mock("~/server/features/user/queries", () => ({ getUserProfileSettings }));
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
  getUserProfileSettings.mockResolvedValue({
    profileCompletedAt: new Date(),
  });
});
afterEach(cleanup);
describe("RouteCreatePage", () => {
  it("既定の大阪の位置で作成画面を開く", async () => {
    render(await RouteCreatePage());
    expect(
      screen.getByRole("heading", { name: "ルートを作成" }),
    ).toBeInTheDocument();
    expect(screenProps).toHaveBeenCalledWith({
      defaultCenter: GOOGLE_MAP_DEFAULT_CENTER,
    });
  });
  it("ユーザー情報がない場合も既定位置を使う", async () => {
    getUserProfileSettings.mockResolvedValue(undefined);
    render(await RouteCreatePage());
    expect(screenProps).toHaveBeenCalledWith({
      defaultCenter: GOOGLE_MAP_DEFAULT_CENTER,
    });
  });
  it("未ログインではログイン案内をその場で表示する", async () => {
    auth.mockResolvedValue(null);
    render(await RouteCreatePage());
    expect(
      screen.getByRole("heading", { name: "ログインが必要です" }),
    ).toBeInTheDocument();
    expect(getUserProfileSettings).not.toHaveBeenCalled();
  });
  it("プロフィール未登録では初期設定を表示する", async () => {
    getUserProfileSettings.mockResolvedValue({ profileCompletedAt: null });
    render(await RouteCreatePage());
    expect(
      screen.getByRole("heading", { name: "初期設定" }),
    ).toBeInTheDocument();
  });
});
