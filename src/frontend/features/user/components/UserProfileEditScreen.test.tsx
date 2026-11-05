import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserProfileEditScreen } from "./UserProfileEditScreen";

const { save, push, refresh, success, error } = vi.hoisted(() => ({
  save: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
const profile = {
  birthDate: "1990-01-01",
  gender: "male",
  pace: "6:00",
  height: 170,
  weight: 60,
};
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("sonner", () => ({ toast: { success, error } }));
vi.mock("~/frontend/features/user/api/useUpdateUserProfile", () => ({
  useUpdateUserProfile: () => ({ updateUserProfile: save, isUpdating: false }),
}));
vi.mock("~/frontend/features/pace/api/usePacesQuery", () => ({
  usePacesQuery: () => ({ paces: [{ value: "6:00" }], error: null }),
}));
beforeEach(() => {
  save.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("UserProfileEditScreen", () => {
  it("保存成功時に通知し、ホームへ戻って表示を更新する", async () => {
    const user = userEvent.setup();
    render(<UserProfileEditScreen initialValues={profile} />);
    await user.click(screen.getByRole("button", { name: "保存する" }));
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith("プロフィールを更新しました。"),
    );
    expect(save).toHaveBeenCalledWith(profile);
    expect(push).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalledOnce();
    expect(error).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "ホームへ戻る" })).toHaveAttribute(
      "href",
      "/",
    );
  });
  it("保存失敗を処理して画面を残し、再送信できる", async () => {
    save.mockRejectedValueOnce(new Error("server detail"));
    const user = userEvent.setup();
    render(<UserProfileEditScreen initialValues={profile} />);
    await user.click(screen.getByRole("button", { name: "保存する" }));
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        "プロフィールを更新できませんでした。時間をおいて再度お試しください。",
      ),
    );
    expect(push).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "保存する" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "保存する" }));
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith("プロフィールを更新しました。"),
    );
    expect(save).toHaveBeenCalledTimes(2);
    expect(push).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalledOnce();
  });
  it("保存中は入力と保存ボタンを無効にし、完了まで遷移しない", async () => {
    let finish: () => void = vi.fn();
    save.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<UserProfileEditScreen initialValues={profile} />);
    await user.click(screen.getByRole("button", { name: "保存する" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "更新中..." })).toBeDisabled(),
    );
    expect(
      screen
        .getAllByRole("spinbutton")
        .every((input) => input.hasAttribute("disabled")),
    ).toBe(true);
    expect(push).not.toHaveBeenCalled();
    finish();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });
  it("入力エラーでは送信せず、エラーをフィールドに表示する", async () => {
    const user = userEvent.setup();
    render(
      <UserProfileEditScreen initialValues={{ ...profile, height: -1 }} />,
    );
    await user.click(screen.getByRole("button", { name: "保存する" }));
    await waitFor(() =>
      expect(
        screen.getByText("Number must be greater than 0"),
      ).toBeInTheDocument(),
    );
    expect(save).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
