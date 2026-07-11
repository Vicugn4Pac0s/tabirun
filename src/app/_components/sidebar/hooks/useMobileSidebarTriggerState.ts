"use client";

import { useAuthPermission } from "~/frontend/features/auth/components/hooks/useAuthPermission";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import { useSelectedRouteStore } from "~/frontend/features/route/stores/selectedRouteStore";
import useGooglemapDirectionQuery from "~/frontend/hooks/googlemap/useGooglemapDirectionQuery";
import { metersToKilometers } from "~/frontend/lib/running";

export function useMobileSidebarTriggerState() {
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const selectedRoute = useSelectedRouteStore((state) => state.selectedRoute);
  const { permissions } = useAuthPermission();
  const { directions, isLoading } = useGooglemapDirectionQuery(routePoints, {
    enabled: permissions.canUseDirections,
  });

  const isDetailState = Boolean(selectedRoute) || routePoints.length >= 2;
  const distanceKm = directions?.distanceMeters
    ? metersToKilometers(directions.distanceMeters)
    : 0;

  if (!isDetailState) {
    return {
      ariaLabel: "一覧を開く",
      isCompact: true,
      label: null,
    };
  }

  if (isLoading) {
    return {
      ariaLabel: "詳細を開く",
      isCompact: false,
      label: "計測中",
    };
  }

  return {
    ariaLabel: "詳細を開く",
    isCompact: false,
    label: distanceKm > 0 ? `${distanceKm} km` : "詳細",
  };
}
