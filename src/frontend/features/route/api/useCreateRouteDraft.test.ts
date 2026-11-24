import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCreateRouteDraft } from "./useCreateRouteDraft";

const { invalidateList, invalidateDrafts, invalidateDetail, useMutation } =
  vi.hoisted(() => ({
    invalidateList: vi.fn(),
    invalidateDrafts: vi.fn(),
    invalidateDetail: vi.fn(),
    useMutation:
      vi.fn<(options: { onSuccess: () => Promise<void> }) => unknown>(),
  }));
vi.mock("~/trpc/react", () => ({
  api: {
    useUtils: () => ({
      route: {
        getByUser: { invalidate: invalidateList },
        getDrafts: { invalidate: invalidateDrafts },
        getById: { invalidate: invalidateDetail },
      },
    }),
    route: { createDraft: { useMutation } },
  },
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe("useCreateRouteDraft", () => {
  it("成功時に下書き一覧だけをinvalidateする", async () => {
    useMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
      reset: vi.fn(),
    });
    renderHook(() => useCreateRouteDraft());
    const options = useMutation.mock.calls[0]?.[0];
    expect(options).toBeDefined();
    await act(async () => options?.onSuccess());
    expect(invalidateDetail).not.toHaveBeenCalled();
    expect(invalidateList).not.toHaveBeenCalled();
    expect(invalidateDrafts).toHaveBeenCalledOnce();
  });
});
