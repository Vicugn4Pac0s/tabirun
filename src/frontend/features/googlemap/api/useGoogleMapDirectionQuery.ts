import { api } from "~/trpc/react";

type UseGoogleMapDirectionQueryOptions = {
  enabled: boolean;
};

export const useGoogleMapDirectionQuery = (
  routePoints: google.maps.LatLngLiteral[],
  options: UseGoogleMapDirectionQueryOptions,
) => {
  const enabled = options.enabled && routePoints.length >= 2;

  const { data, ...query } = api.googlemap.getDirection.useQuery(
    { routePoints },
    {
      enabled,
      staleTime: Infinity,
      retry: false,
    },
  );

  return {
    directions: data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    enabled,
  };
};
