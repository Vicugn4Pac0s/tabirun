import { type TRPCClientErrorLike } from "@trpc/client";
import { type AppRouter } from "~/server/api/root";
import useGooglemapDirectionQuery from "./useGooglemapDirectionQuery";

type UseRoutePolylinePathOptions = {
  canUseDirections: boolean;
};

export const useRoutePolylinePath = (
  routePoints: google.maps.LatLngLiteral[],
  options: UseRoutePolylinePathOptions,
) => {
  const { directions, error, ...query } = useGooglemapDirectionQuery(routePoints, {
    enabled: options.canUseDirections,
  });

  const hasEnoughRoutePoints = routePoints.length >= 2;
  const isQuotaExceeded =
    (error as TRPCClientErrorLike<AppRouter> | null)?.data?.code ===
    "TOO_MANY_REQUESTS";
  const shouldFallbackToStraightPolyline =
    hasEnoughRoutePoints && (!options.canUseDirections || isQuotaExceeded);

  const polylinePath =
    directions?.path.length
      ? directions.path
      : shouldFallbackToStraightPolyline
        ? routePoints
        : null;

  return {
    polylinePath,
    directions,
    error,
    ...query,
  };
};

export default useRoutePolylinePath;
