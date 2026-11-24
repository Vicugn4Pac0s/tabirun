import { api } from "~/trpc/react";

/** 地点の更新操作と状態を返し、成功時は詳細と両一覧を再取得対象にする。 */
export const useUpdateRoutePoints = () => {
  const utils = api.useUtils();
  const mutation = api.route.updatePoints.useMutation({
    onSuccess: async (_data, input) => {
      await Promise.all([
        utils.route.getById.invalidate({ id: input.id }),
        utils.route.getByUser.invalidate(),
        utils.route.getDrafts.invalidate(),
      ]);
    },
  });
  return {
    updatePoints: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
