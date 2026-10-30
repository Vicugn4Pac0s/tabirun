import { api } from "~/trpc/react";

type UseCurrentUserQueryOptions = {
  enabled?: boolean;
};

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
