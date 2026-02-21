import { api } from "~/trpc/react";

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