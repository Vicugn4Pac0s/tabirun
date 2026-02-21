import { api } from "~/trpc/react";

type CreateRouteInput = Parameters<
  ReturnType<typeof api.route.create.useMutation>["mutate"]
>[0];

type CreateRouteCallbacks = {
  onSuccess?: () => void | Promise<void>;
  onError?: (err: unknown) => void | Promise<void>;
  onSettled?: () => void | Promise<void>;
};

export const useCreateRoute = () => {
  const utils = api.useUtils();

  const mutation = api.route.create.useMutation({
    onSuccess: async () => {
      await utils.route.getByUser.invalidate();
    },
  });

  const createRoute = async (input: CreateRouteInput, cb?: CreateRouteCallbacks) => {
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
    createRoute,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};