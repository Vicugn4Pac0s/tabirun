import { api } from "~/trpc/react";

export const useUserQuery = () => {
  const { data, ...query } = api.user.getCurrent.useQuery(undefined, {
    staleTime: Infinity,
  });

  return {
    user: data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
};
