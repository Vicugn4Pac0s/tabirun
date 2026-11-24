import { api } from "~/trpc/react";

/** 名前の更新操作を返し、成功時は詳細・完了済み一覧・下書き一覧を再取得対象にする。 */
export const useUpdateRouteDetails = () => {
  const utils = api.useUtils();
  const mutation = api.route.updateDetails.useMutation({
    onSuccess: async (_data, input) => {
      await Promise.all([
        utils.route.getById.invalidate({ id: input.id }),
        utils.route.getByUser.invalidate(),
        utils.route.getDrafts.invalidate(),
      ]);
    },
  });
  return {
    updateDetails: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
