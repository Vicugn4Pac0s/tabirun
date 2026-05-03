import {
  executeMutationWithCallbacks,
  type MutationCallbacks,
} from "~/frontend/lib/executeMutationWithCallbacks";
import type { UserProfileUpdateInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

type UpdateUserCallbacks = MutationCallbacks;

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
    return executeMutationWithCallbacks(mutation, input, cb);
  };

  return {
    updateUser,
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
