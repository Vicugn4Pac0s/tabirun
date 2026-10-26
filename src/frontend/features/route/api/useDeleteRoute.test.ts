import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RouteDeleteInput } from "~/shared/schemas";
import { useDeleteRoute } from "./useDeleteRoute";

const { invalidateList, invalidateDetail, useMutation } = vi.hoisted(() => ({
  invalidateList: vi.fn(),
  invalidateDetail: vi.fn(),
  useMutation:
    vi.fn<
      (options: {
        onSuccess: (data: undefined, input: RouteDeleteInput) => Promise<void>;
      }) => unknown
    >(),
}));

vi.mock("~/trpc/react", () => ({
  api: {
    useUtils: () => ({
      route: {
        getByUser: { invalidate: invalidateList },
        getById: { invalidate: invalidateDetail },
      },
    }),
    route: { delete: { useMutation } },
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useDeleteRoute", () => {
  it("削除成功時にルート一覧と対象の詳細をinvalidateする", async () => {
    useMutation.mockReturnValue({
      isPending: false,
      error: null,
      reset: vi.fn(),
      mutateAsync: vi.fn(),
    });
    renderHook(() => useDeleteRoute());
    const options: {
      onSuccess: (data: undefined, input: RouteDeleteInput) => Promise<void>;
    } = useMutation.mock.calls[0]![0];

    await act(() => options.onSuccess(undefined, { id: 42 }));

    expect(invalidateList).toHaveBeenCalledOnce();
    expect(invalidateDetail).toHaveBeenCalledWith({ id: 42 });
  });
});
