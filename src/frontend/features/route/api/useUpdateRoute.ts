import type { RouteUpdateInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

export const useUpdateRoute = () => {
  const utils = api.useUtils();

  const mutation = api.route.update.useMutation({
    onSuccess: async (_data, input) => {
      await Promise.all([
        utils.route.getByUser.invalidate(),
        utils.route.getById.invalidate({ id: input.id }),
      ]);
    },
  });

  const updateRoute = (input: RouteUpdateInput) => {
    return mutation.mutateAsync(input);
  };

  return {
    updateRoute,
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
