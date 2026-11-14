import { api } from "~/trpc/react";

/**
 * ルート一覧と取得状態を返し、未取得時は空配列にする。
 * キャッシュは時間経過で古くせず、更新操作による無効化で再取得する。
 */
export const useRoutesQuery = () => {
  const { data, ...query } = api.route.getByUser.useQuery(undefined, {
    staleTime: Infinity,
  });

  return {
    routes: data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
};
