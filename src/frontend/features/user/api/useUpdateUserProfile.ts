import type { UserProfileUpdateInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

/**
 * プロフィールを更新する操作と進行・エラー状態を返す。
 * 成功時は現在のプロフィールのqueryを無効化する。
 */
export const useUpdateUserProfile = () => {
  const utils = api.useUtils();

  const mutation = api.user.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.user.getCurrent.invalidate();
    },
  });

  const updateUserProfile = (input: UserProfileUpdateInput) => {
    return mutation.mutateAsync(input);
  };

  return {
    updateUserProfile,
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
