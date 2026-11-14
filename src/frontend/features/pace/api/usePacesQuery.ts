import { api } from "~/trpc/react";

/**
 * ペース一覧を取得し、未取得時は空配列を返す。
 * 自動の期限切れを設けず、取得状態とエラーを呼出側へ渡す。
 */
export const usePacesQuery = () => {
  const { data, ...query } = api.pace.getPace.useQuery(undefined, {
    staleTime: Infinity,
  });

  return {
    paces: data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
};
