import { api } from "~/trpc/react";

type UseGoogleMapDirectionQueryOptions = {
  enabled: boolean;
};

/**
 * 有効かつ2地点以上の場合だけ経路を取得し、未取得の結果はnullで返す。
 * 自動再試行を行わず、取得結果は明示的な無効化まで期限切れにしない。
 */
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
