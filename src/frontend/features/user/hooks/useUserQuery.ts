import { api } from "~/trpc/react";

type UseUserQueryOptions = {
  enabled?: boolean;
};

export const useUserQuery = ({ enabled = true }: UseUserQueryOptions = {}) => {
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
