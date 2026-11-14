import { api } from "~/trpc/react";

type UseCurrentUserQueryOptions = {
  enabled?: boolean;
};

/**
 * ログイン中のプロフィールを取得し、未取得・対象なしはuserにnullを返す。
 * 自動の期限切れは設けず、enabledがfalseなら取得を開始しない。
 */
export const useCurrentUserQuery = ({
  enabled = true,
}: UseCurrentUserQueryOptions = {}) => {
  const { data, ...query } = api.user.getCurrent.useQuery(undefined, {
    staleTime: Infinity,
    enabled,
  });

  return {
    user: data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
};
