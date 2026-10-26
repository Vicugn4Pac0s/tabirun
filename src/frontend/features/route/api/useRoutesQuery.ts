import { api } from "~/trpc/react";

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