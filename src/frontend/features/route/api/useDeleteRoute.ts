import type { RouteDeleteInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

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

  const deleteRoute = (input: RouteDeleteInput) => {
    return mutation.mutateAsync(input);
  };

  return {
    deleteRoute,
    isDeleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
