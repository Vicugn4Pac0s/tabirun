import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginScreen } from "./LoginScreen";
const { signIn } = vi.hoisted(() => ({ signIn: vi.fn() }));
vi.mock("next-auth/react", () => ({ signIn }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
describe("LoginScreen", () => {
  it("現在のページでログインを開始し、処理中は無効にする", async () => {
    signIn.mockImplementation(() => new Promise(() => undefined));
    const user = userEvent.setup();
    render(<LoginScreen />);
    await user.click(screen.getByRole("button", { name: "Googleでログイン" }));
    expect(signIn).toHaveBeenCalledWith("google");
    expect(
      screen.getByRole("button", { name: "ログイン中..." }),
    ).toBeDisabled();
  });
  it("開始に失敗したら案内を表示して再試行できる", async () => {
    signIn.mockRejectedValueOnce(new Error("failure"));
    const user = userEvent.setup();
    render(<LoginScreen />);
    await user.click(screen.getByRole("button", { name: "Googleでログイン" }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeVisible());
    expect(
      screen.getByRole("button", { name: "Googleでログイン" }),
    ).toBeEnabled();
  });
});
