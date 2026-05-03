import {
  executeMutationWithCallbacks,
  type MutationCallbacks,
} from "~/frontend/lib/executeMutationWithCallbacks";
import type { RouteUpdateInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

type UpdateRouteCallbacks = MutationCallbacks;

export const useUpdateRoute = () => {
  const utils = api.useUtils();

  const mutation = api.route.update.useMutation({
    onSuccess: async () => {
      await utils.route.getByUser.invalidate();
    },
  });

  const updateRoute = async (input: RouteUpdateInput, cb?: UpdateRouteCallbacks) => {
    return executeMutationWithCallbacks(mutation, input, cb);
  };

  return {
    updateRoute,
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
