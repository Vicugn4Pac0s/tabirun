import { api } from "~/trpc/react";

/** 本人の下書き一覧と取得状態を返す。鮮度はmutationによるinvalidateで更新する。 */
export const useDraftRoutesQuery = ({
  enabled = true,
}: { enabled?: boolean } = {}) => {
  const { data, ...query } = api.route.getDrafts.useQuery(undefined, {
    staleTime: Infinity,
    enabled,
  });
  return { drafts: data ?? [], isLoading: query.isLoading, error: query.error };
};
