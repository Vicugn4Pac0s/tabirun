import type { RouteDeleteInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

/**
 * ルート削除の操作と状態を返し、成功時に一覧と対象ルート詳細のキャッシュを無効化する。
 */
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
