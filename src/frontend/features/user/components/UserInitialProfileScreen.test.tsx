import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserInitialProfileScreen } from "./UserInitialProfileScreen";

const { save, refresh, success, error } = vi.hoisted(() => ({
  save: vi.fn(),
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
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", () => ({ toast: { success, error } }));
vi.mock("~/frontend/features/user/api/useCompleteInitialProfile", () => ({
  useCompleteInitialProfile: () => ({
    completeInitialProfile: save,
    isCompleting: false,
  }),
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

describe("UserInitialProfileScreen", () => {
  it("保存成功時に通知し、現在のページを再取得する", async () => {
    const user = userEvent.setup();
    render(<UserInitialProfileScreen initialValues={profile} />);
    await user.click(screen.getByRole("button", { name: "初期設定を完了" }));
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith("初期設定を保存しました。"),
    );
    expect(save).toHaveBeenCalledWith(profile);
    expect(refresh).toHaveBeenCalledOnce();
    expect(error).not.toHaveBeenCalled();
  });
  it("保存失敗を処理して画面を残し、再送信できる", async () => {
    save.mockRejectedValueOnce(new Error("server detail"));
    const user = userEvent.setup();
    render(<UserInitialProfileScreen initialValues={profile} />);
    await user.click(screen.getByRole("button", { name: "初期設定を完了" }));
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        "初期設定を保存できませんでした。時間をおいて再度お試しください。",
      ),
    );
    expect(refresh).not.toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "初期設定を完了" }),
    ).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "初期設定を完了" }));
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith("初期設定を保存しました。"),
    );
    expect(save).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledOnce();
  });
  it("初回設定の必須項目が未入力なら送信しない", async () => {
    const user = userEvent.setup();
    render(<UserInitialProfileScreen initialValues={{}} />);
    await user.click(screen.getByRole("button", { name: "初期設定を完了" }));
    await waitFor(() =>
      expect(screen.getAllByText("Required").length).toBeGreaterThan(0),
    );
    for (const label of [
      "生年月日",
      "性別",
      "ランニングのペース",
      "身長(cm)",
      "体重(kg)",
    ]) {
      const input = screen.getByLabelText(label);
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAccessibleDescription("Required");
    }
    expect(screen.getAllByRole("alert")).toHaveLength(5);
    expect(save).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
