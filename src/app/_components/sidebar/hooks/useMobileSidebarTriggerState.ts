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
      ariaLabel: "メニューを開く",
      label: "MENU",
    };
  }

  if (isLoading) {
    return {
      ariaLabel: "メニューを開く",
      label: "MEASURING",
    };
  }

  return {
    ariaLabel: "メニューを開く",
    label: distanceKm > 0 ? `${distanceKm} km` : "MENU",
  };
}
