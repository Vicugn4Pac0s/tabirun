import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RouteUpdateInput } from "~/shared/schemas";
import { useUpdateRoute } from "./useUpdateRoute";
const { invalidateList, invalidateDetail, useMutation } = vi.hoisted(() => ({
  invalidateList: vi.fn(),
  invalidateDetail: vi.fn(),
  useMutation:
    vi.fn<
      (options: {
        onSuccess: (data: undefined, input: RouteUpdateInput) => Promise<void>;
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
    route: { update: { useMutation } },
  },
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe("useUpdateRoute", () => {
  it("更新成功時にルート一覧と対象の詳細をinvalidateする", async () => {
    useMutation.mockReturnValue({
      isPending: false,
      error: null,
      reset: vi.fn(),
      mutateAsync: vi.fn(),
    });
    const { result } = renderHook(() => useUpdateRoute());
    const input = {
      id: 42,
      title: "朝",
      points: [
        { lat: 35, lng: 135 },
        { lat: 36, lng: 136 },
      ],
    };
    const options: {
      onSuccess: (data: undefined, savedInput: typeof input) => Promise<void>;
    } = useMutation.mock.calls[0]![0];
    await act(() => options.onSuccess(undefined, input));
    expect(invalidateList).toHaveBeenCalledOnce();
    expect(invalidateDetail).toHaveBeenCalledWith({ id: 42 });
    expect(result.current.updateRoute).toBeTypeOf("function");
  });
});
