import {
  executeMutationWithCallbacks,
  type MutationCallbacks,
} from "~/frontend/lib/executeMutationWithCallbacks";
import type { RouteDeleteInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

type DeleteRouteCallbacks = MutationCallbacks;

export const useDeleteRoute = () => {
  const utils = api.useUtils();

  const mutation = api.route.delete.useMutation({
    onSuccess: async (_data, input) => {
      await Promise.all([
        utils.route.getByUser.invalidate(),
        utils.route.getById.invalidate({ id: input.id }),
      ]);
    },
  });

  const deleteRoute = async (
    input: RouteDeleteInput,
    cb?: DeleteRouteCallbacks,
  ) => {
    return executeMutationWithCallbacks(mutation, input, cb);
  };

  return {
    deleteRoute,
    isDeleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
