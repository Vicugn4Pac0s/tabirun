import type { UserInitialProfileInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

/**
 * 初期プロフィールを保存する操作と進行・エラー状態を返す。
 * 成功時は現在のプロフィールのqueryを無効化する。
 */
export const useCompleteInitialProfile = () => {
  const utils = api.useUtils();

  const mutation = api.user.completeInitialProfile.useMutation({
    onSuccess: async () => {
      await utils.user.getCurrent.invalidate();
    },
  });

  const completeInitialProfile = (input: UserInitialProfileInput) => {
    return mutation.mutateAsync(input);
  };

  return {
    completeInitialProfile,
    isCompleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
