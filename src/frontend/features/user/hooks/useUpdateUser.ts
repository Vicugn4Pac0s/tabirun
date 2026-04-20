import type { UserProfileUpdateInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

type UpdateUserCallbacks = {
  onSuccess?: () => void | Promise<void>;
  onError?: (err: unknown) => void | Promise<void>;
  onSettled?: () => void | Promise<void>;
};

export const useUpdateUser = () => {
  const utils = api.useUtils();

  const mutation = api.user.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.user.getCurrent.invalidate();
    },
  });

  const updateUser = async (
    input: UserProfileUpdateInput,
    cb?: UpdateUserCallbacks,
  ) => {
    try {
      const result = await mutation.mutateAsync(input);
      await cb?.onSuccess?.();
      return result;
    } catch (err) {
      await cb?.onError?.(err);
      throw err;
    } finally {
      await cb?.onSettled?.();
    }
  };

  return {
    updateUser,
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
