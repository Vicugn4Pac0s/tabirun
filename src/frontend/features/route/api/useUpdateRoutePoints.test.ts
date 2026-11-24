import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RouteUpdatePointsInput } from "~/shared/schemas";
import { useUpdateRoutePoints } from "./useUpdateRoutePoints";

const { invalidateList, invalidateDrafts, invalidateDetail, useMutation } =
  vi.hoisted(() => ({
    invalidateList: vi.fn(),
    invalidateDrafts: vi.fn(),
    invalidateDetail: vi.fn(),
    useMutation:
      vi.fn<
        (options: {
          onSuccess: (
            data: undefined,
            input: RouteUpdatePointsInput,
          ) => Promise<void>;
        }) => unknown
      >(),
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
    route: { updatePoints: { useMutation } },
  },
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe("useUpdateRoutePoints", () => {
  it("成功時に対象の詳細と両一覧をinvalidateする", async () => {
    useMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
      reset: vi.fn(),
    });
    renderHook(() => useUpdateRoutePoints());
    const options = useMutation.mock.calls[0]?.[0];
    expect(options).toBeDefined();
    await act(async () =>
      options?.onSuccess(undefined, {
        id: 42,
        points: [
          { lat: 35, lng: 139 },
          { lat: 36, lng: 140 },
        ],
      }),
    );
    expect(invalidateDetail).toHaveBeenCalledExactlyOnceWith({ id: 42 });
    expect(invalidateList).toHaveBeenCalledOnce();
    expect(invalidateDrafts).toHaveBeenCalledOnce();
  });
});
