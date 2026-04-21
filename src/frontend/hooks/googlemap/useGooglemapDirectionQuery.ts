import { api } from "~/trpc/react";

type UseGooglemapDirectionQueryOptions = {
  enabled: boolean;
};

export const useGooglemapDirectionQuery = (
  routePoints: google.maps.LatLngLiteral[],
  options: UseGooglemapDirectionQueryOptions,
) => {
  const enabled = options.enabled && routePoints.length >= 2;

  const { data, ...query } =
    api.googlemap.getDirection.useQuery(
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

export default useGooglemapDirectionQuery;