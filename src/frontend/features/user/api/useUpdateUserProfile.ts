import type { UserProfileUpdateInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

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
