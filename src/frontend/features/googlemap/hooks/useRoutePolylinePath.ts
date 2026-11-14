import { type TRPCClientErrorLike } from "@trpc/client";
import { type AppRouter } from "~/server/api/root";
import { useGoogleMapDirectionQuery } from "../api/useGoogleMapDirectionQuery";

type UseRoutePolylinePathOptions = {
  canUseDirections: boolean;
};

/**
 * 取得した経路の描画座標を返し、経路取得を使えない場合や上限到達時は2地点以上を直線で結ぶ。
 * 取得経路も直線への縮退条件も満たさない場合は、描画座標をnullで返す。
 */
export const useRoutePolylinePath = (
  routePoints: google.maps.LatLngLiteral[],
  options: UseRoutePolylinePathOptions,
) => {
  const { directions, error, ...query } = useGoogleMapDirectionQuery(
    routePoints,
    {
      enabled: options.canUseDirections,
    },
  );

  const hasEnoughRoutePoints = routePoints.length >= 2;
  const isQuotaExceeded =
    (error as TRPCClientErrorLike<AppRouter> | null)?.data?.code ===
    "TOO_MANY_REQUESTS";
  const shouldFallbackToStraightPolyline =
    hasEnoughRoutePoints && (!options.canUseDirections || isQuotaExceeded);

  const polylinePath = directions?.path.length
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
