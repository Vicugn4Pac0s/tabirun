import type { RouteDeleteInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

type DeleteRouteCallbacks = {
  onSuccess?: () => void | Promise<void>;
  onError?: (err: unknown) => void | Promise<void>;
  onSettled?: () => void | Promise<void>;
};

export const useDeleteRoute = () => {
  const utils = api.useUtils();

  const mutation = api.route.delete.useMutation({
    onSuccess: async () => {
      await utils.route.getByUser.invalidate();
    },
  });

  const deleteRoute = async (input: RouteDeleteInput, cb?: DeleteRouteCallbacks) => {
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
    deleteRoute,
    isDeleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
