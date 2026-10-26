import {
  executeMutationWithCallbacks,
  type MutationCallbacks,
} from "~/frontend/lib/executeMutationWithCallbacks";
import type { UserProfileUpdateInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

type UpdateUserProfileCallbacks = MutationCallbacks;

export const useUpdateUserProfile = () => {
  const utils = api.useUtils();

  const mutation = api.user.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.user.getCurrent.invalidate();
    },
  });

  const updateUserProfile = async (
    input: UserProfileUpdateInput,
    cb?: UpdateUserProfileCallbacks,
  ) => {
    return executeMutationWithCallbacks(mutation, input, cb);
  };

  return {
    updateUserProfile,
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
