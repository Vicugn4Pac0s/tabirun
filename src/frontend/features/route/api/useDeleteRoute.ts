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
    onSuccess: async () => {
      await utils.route.getByUser.invalidate();
    },
  });

  const deleteRoute = async (input: RouteDeleteInput, cb?: DeleteRouteCallbacks) => {
    return executeMutationWithCallbacks(mutation, input, cb);
  };

  return {
    deleteRoute,
    isDeleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
