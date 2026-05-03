import {
  executeMutationWithCallbacks,
  type MutationCallbacks,
} from "~/frontend/lib/executeMutationWithCallbacks";
import type { RouteCreateInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

type CreateRouteCallbacks = MutationCallbacks;

export const useCreateRoute = () => {
  const utils = api.useUtils();

  const mutation = api.route.create.useMutation({
    onSuccess: async () => {
      await utils.route.getByUser.invalidate();
    },
  });

  const createRoute = async (input: RouteCreateInput, cb?: CreateRouteCallbacks) => {
    return executeMutationWithCallbacks(mutation, input, cb);
  };

  return {
    createRoute,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
