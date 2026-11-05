import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useUpdateUserProfile } from "./useUpdateUserProfile";

const { invalidate, mutateAsync, reset, useMutation } = vi.hoisted(() => ({
  invalidate: vi.fn(),
  mutateAsync: vi.fn(),
  reset: vi.fn(),
  useMutation:
    vi.fn<(options: { onSuccess: () => Promise<void> }) => unknown>(),
}));
vi.mock("~/trpc/react", () => ({
  api: {
    useUtils: () => ({ user: { getCurrent: { invalidate } } }),
    user: { updateProfile: { useMutation } },
  },
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const input = {
  birthDate: "1990-01-01",
  gender: "male",
  pace: "6:00",
  height: 170,
  weight: 60,
};

describe("useUpdateUserProfile", () => {
  it("保存成功時に現在のプロフィールをinvalidateする", async () => {
    useMutation.mockReturnValue({
      mutateAsync,
      reset,
      isPending: false,
      error: null,
    });
    mutateAsync.mockImplementation(async () => {
      await useMutation.mock.calls.at(0)?.[0].onSuccess();
    });
    const { result } = renderHook(() => useUpdateUserProfile());
    await act(() => result.current.updateUserProfile(input));
    expect(mutateAsync).toHaveBeenCalledWith(input);
    expect(invalidate).toHaveBeenCalledOnce();
  });
  it("保存失敗を呼び出し元へ返し、pendingとerrorとresetを維持する", async () => {
    const error = new Error("save failed");
    mutateAsync.mockRejectedValue(error);
    useMutation.mockReturnValue({ mutateAsync, reset, isPending: true, error });
    const { result } = renderHook(() => useUpdateUserProfile());
    await expect(result.current.updateUserProfile(input)).rejects.toBe(error);
    expect(invalidate).not.toHaveBeenCalled();
    expect(result.current.isUpdating).toBe(true);
    expect(result.current.error).toBe(error);
    expect(result.current.reset).toBe(reset);
  });
});
