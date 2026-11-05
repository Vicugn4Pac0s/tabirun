import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserProfileDialog } from "./UserProfileDialog";

const { save, onOpenChange, success, error } = vi.hoisted(() => ({
  save: vi.fn(),
  onOpenChange: vi.fn(),
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
vi.mock("sonner", () => ({ toast: { success, error } }));
vi.mock("~/frontend/features/user/api/useUpdateUserProfile", () => ({
  useUpdateUserProfile: () => ({ updateUserProfile: save, isUpdating: false }),
}));
vi.mock("~/frontend/features/pace/api/usePacesQuery", () => ({
  usePacesQuery: () => ({ paces: [{ value: "6:00" }], error: null }),
}));
vi.mock("~/frontend/features/user/api/useCurrentUserQuery", () => ({
  useCurrentUserQuery: () => ({ user: profile, isLoading: false, error: null }),
}));
beforeEach(() => {
  save.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("UserProfileDialog", () => {
  it("保存成功時に通知し、既存の画面遷移を行う", async () => {
    const user = userEvent.setup();
    render(<UserProfileDialog open onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: "保存する" }));
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith("プロフィールを更新しました。"),
    );
    expect(save).toHaveBeenCalledWith(profile);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(error).not.toHaveBeenCalled();
  });
  it("保存失敗を処理して画面を残し、再送信できる", async () => {
    save.mockRejectedValueOnce(new Error("server detail"));
    const user = userEvent.setup();
    render(<UserProfileDialog open onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: "保存する" }));
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        "プロフィールを更新できませんでした。時間をおいて再度お試しください。",
      ),
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "保存する" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "保存する" }));
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith("プロフィールを更新しました。"),
    );
    expect(save).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
