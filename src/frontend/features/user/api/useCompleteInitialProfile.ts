import type { UserInitialProfileInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

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
