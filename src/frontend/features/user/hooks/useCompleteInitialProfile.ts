import type { UserInitialProfileInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

type CompleteInitialProfileCallbacks = {
  onSuccess?: () => void | Promise<void>;
  onError?: (err: unknown) => void | Promise<void>;
  onSettled?: () => void | Promise<void>;
};

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
    completeInitialProfile,
    isCompleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
