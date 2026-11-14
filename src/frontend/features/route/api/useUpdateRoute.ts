import type { RouteUpdateInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

/**
 * ルート更新の操作と状態を返し、成功時に一覧と対象ルート詳細のキャッシュを無効化する。
 */
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
