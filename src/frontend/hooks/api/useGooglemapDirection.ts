import { api } from "~/trpc/react";

export const useGooglemapDirection = (
  routePoints: google.maps.LatLngLiteral[],
) => {
  const enabled = routePoints.length >= 2;

  const { data, ...query } =
    api.googlemap.getDirection.useQuery(
      { routePoints },
      {
        enabled,
        staleTime: Infinity,
      },
    );

  return {
    directions: data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    enabled,
  };
};

export default useGooglemapDirection;