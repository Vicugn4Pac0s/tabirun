export type MutationCallbacks = {
  onSuccess?: () => void | Promise<void>;
  onError?: (err: unknown) => void | Promise<void>;
  onSettled?: () => void | Promise<void>;
};

type MutationLike<TInput, TResult> = {
  mutateAsync: (input: TInput) => Promise<TResult>;
};

export const executeMutationWithCallbacks = async <TInput, TResult>(
  mutation: MutationLike<TInput, TResult>,
  input: TInput,
  cb?: MutationCallbacks,
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
