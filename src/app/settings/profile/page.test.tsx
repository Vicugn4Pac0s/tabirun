import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import UserProfileEditPage from "./page";
const { auth, getUserProfileSettings, screenProps } = vi.hoisted(() => ({
  auth: vi.fn(),
  getUserProfileSettings: vi.fn(),
  screenProps: vi.fn(),
}));
vi.mock("~/server/auth", () => ({ auth }));
vi.mock("~/server/features/user/queries", () => ({ getUserProfileSettings }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
vi.mock("~/frontend/features/user/components/UserProfileEditScreen", () => ({
  UserProfileEditScreen: (props: unknown) => {
    screenProps(props);
    return <h1>プロフィールを編集</h1>;
  },
}));
beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "owner" } });
  getUserProfileSettings.mockResolvedValue({
    profileCompletedAt: new Date(),
    birthDate: "1990-01-01",
    gender: "male",
    pace: "6:00",
    height: 170,
    weight: 60,
  });
});
afterEach(cleanup);
describe("UserProfileEditPage", () => {
  it("ログインユーザーのプロフィールを取得して初期値として渡す", async () => {
    render(await UserProfileEditPage());
    expect(
      screen.getByRole("heading", { name: "プロフィールを編集" }),
    ).toBeInTheDocument();
    expect(getUserProfileSettings).toHaveBeenCalledWith("owner");
    expect(screenProps).toHaveBeenCalledWith({
      initialValues: {
        birthDate: "1990-01-01",
        gender: "male",
        pace: "6:00",
        height: 170,
        weight: 60,
      },
    });
  });
  it("任意項目のnullを未入力として渡す", async () => {
    getUserProfileSettings.mockResolvedValue({
      profileCompletedAt: new Date(),
      birthDate: null,
      gender: null,
      pace: null,
      height: null,
      weight: null,
    });
    render(await UserProfileEditPage());
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
  it("未ログインならログイン案内へ移動し、取得しない", async () => {
    auth.mockResolvedValue(null);
    await expect(UserProfileEditPage()).rejects.toThrow(
      "REDIRECT:/login?returnTo=%2Fsettings%2Fprofile",
    );
    expect(getUserProfileSettings).not.toHaveBeenCalled();
  });
  it("ユーザーが存在しなければログイン案内へ移動する", async () => {
    getUserProfileSettings.mockResolvedValue(undefined);
    await expect(UserProfileEditPage()).rejects.toThrow("REDIRECT:/");
  });
  it("プロフィール未完了なら初回設定へ戻す", async () => {
    getUserProfileSettings.mockResolvedValue({ profileCompletedAt: null });
    await expect(UserProfileEditPage()).rejects.toThrow(
      "REDIRECT:/setup-profile?returnTo=%2Fsettings%2Fprofile",
    );
  });
});
