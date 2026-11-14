import type { RouteCreateInput } from "~/shared/schemas";
import { api } from "~/trpc/react";

/**
 * ルート作成の操作と状態を返し、成功時にルート一覧のキャッシュを無効化する。
 */
export const useCreateRoute = () => {
  const utils = api.useUtils();

  const mutation = api.route.create.useMutation({
    onSuccess: async () => {
      await utils.route.getByUser.invalidate();
    },
  });

  const createRoute = (input: RouteCreateInput) => {
    return mutation.mutateAsync(input);
  };

  return {
    createRoute,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
