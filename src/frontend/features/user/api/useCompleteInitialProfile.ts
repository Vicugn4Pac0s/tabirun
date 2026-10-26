import {
  executeMutationWithCallbacks,
  type MutationCallbacks,
} from "~/frontend/lib/executeMutationWithCallbacks";
import type { UserInitialProfileInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

type CompleteInitialProfileCallbacks = MutationCallbacks;

export const useCompleteInitialProfile = () => {
  const utils = api.useUtils();

  const mutation = api.user.completeInitialProfile.useMutation({
    onSuccess: async () => {
      await utils.user.getCurrent.invalidate();
    },
  });

  const completeInitialProfile = async (
    input: UserInitialProfileInput,
    cb?: CompleteInitialProfileCallbacks,
  ) => {
    return executeMutationWithCallbacks(mutation, input, cb);
  };

  return {
    completeInitialProfile,
    isCompleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
