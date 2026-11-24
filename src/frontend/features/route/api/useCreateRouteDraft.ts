import { api } from "~/trpc/react";

/** 下書きの作成操作と状態を返し、成功時は下書き一覧を再取得対象にする。 */
export const useCreateRouteDraft = () => {
  const utils = api.useUtils();
  const mutation = api.route.createDraft.useMutation({
    onSuccess: async () => {
      await utils.route.getDrafts.invalidate();
    },
  });
  return {
    createDraft: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
