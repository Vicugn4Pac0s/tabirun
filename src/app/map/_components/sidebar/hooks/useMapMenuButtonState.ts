"use client";

import { useAuthPermission } from "~/frontend/features/auth/components/hooks/useAuthPermission";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import { useSelectedRouteStore } from "~/frontend/features/route/stores/selectedRouteStore";
import useGooglemapDirectionQuery from "~/frontend/hooks/googlemap/useGooglemapDirectionQuery";
import { getRouteMenuLabel } from "~/frontend/features/route/lib/getRouteMenuLabel";

export function useMapMenuButtonState() {
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const selectedRoute = useSelectedRouteStore((state) => state.selectedRoute);
  const { permissions } = useAuthPermission();
  const { directions, isLoading } = useGooglemapDirectionQuery(routePoints, {
    enabled: permissions.canUseDirections,
  });

  const isDetailState = Boolean(selectedRoute) || routePoints.length >= 2;
  return {
    ariaLabel: "メニューを開く",
    label: isDetailState
      ? getRouteMenuLabel(directions?.distanceMeters, isLoading)
      : "MENU",
  };
}
