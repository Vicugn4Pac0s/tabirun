import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InitialProfileForm } from "./InitialProfileForm";

const { save, replace, success, error } = vi.hoisted(() => ({
  save: vi.fn(),
  replace: vi.fn(),
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
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
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

describe("InitialProfileForm", () => {
  it("保存成功時に通知し、既存の画面遷移を行う", async () => {
    const user = userEvent.setup();
    render(<InitialProfileForm initialValues={profile} />);
    await user.click(screen.getByRole("button", { name: "初期設定を完了" }));
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith("初期設定を保存しました。"),
    );
    expect(save).toHaveBeenCalledWith(profile);
    expect(replace).toHaveBeenCalledWith("/");
    expect(error).not.toHaveBeenCalled();
  });
  it("保存失敗を処理して画面を残し、再送信できる", async () => {
    save.mockRejectedValueOnce(new Error("server detail"));
    const user = userEvent.setup();
    render(<InitialProfileForm initialValues={profile} />);
    await user.click(screen.getByRole("button", { name: "初期設定を完了" }));
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        "初期設定を保存できませんでした。時間をおいて再度お試しください。",
      ),
    );
    expect(replace).not.toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "初期設定を完了" }),
    ).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "初期設定を完了" }));
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith("初期設定を保存しました。"),
    );
    expect(save).toHaveBeenCalledTimes(2);
    expect(replace).toHaveBeenCalledWith("/");
  });
  it("初回設定の必須項目が未入力なら送信しない", async () => {
    const user = userEvent.setup();
    render(<InitialProfileForm initialValues={{}} />);
    await user.click(screen.getByRole("button", { name: "初期設定を完了" }));
    await waitFor(() =>
      expect(screen.getAllByText("Required").length).toBeGreaterThan(0),
    );
    expect(save).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});
