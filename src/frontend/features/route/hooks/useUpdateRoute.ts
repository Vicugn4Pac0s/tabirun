import type { RouteUpdateInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

type UpdateRouteCallbacks = {
  onSuccess?: () => void | Promise<void>;
  onError?: (err: unknown) => void | Promise<void>;
  onSettled?: () => void | Promise<void>;
};

export const useUpdateRoute = () => {
  const utils = api.useUtils();

  const mutation = api.route.update.useMutation({
    onSuccess: async () => {
      await utils.route.getByUser.invalidate();
    },
  });

  const updateRoute = async (input: RouteUpdateInput, cb?: UpdateRouteCallbacks) => {
    try {
      const result = await mutation.mutateAsync(input);
      await cb?.onSuccess?.();
      return result;
    } catch (err) {
      await cb?.onError?.(err);
      throw err;
    } finally {
      await cb?.onSettled?.();
    }
  };

  return {
    updateRoute,
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
