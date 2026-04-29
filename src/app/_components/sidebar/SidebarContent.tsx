"use client";

import { useAuthPermission } from "~/frontend/features/auth/components/hooks/useAuthPermission";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import RouteDetailView from "~/frontend/features/route/components/RouteDetailView";
import RouteList from "~/frontend/features/route/components/RouteList";
import { useSelectedRouteStore } from "~/frontend/features/route/stores/selectedRouteStore";
import RunDetailOverview from "../RunDetailOverview";
import GuestSidebarContent from "./GuestSidebarContent";

function SidebarContent() {
  const { isAuthenticated } = useAuthPermission();
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const selectedRoute = useSelectedRouteStore((state) => state.selectedRoute);

  if (!isAuthenticated) {
    return <GuestSidebarContent />;
  }

  if (selectedRoute) {
    return <RouteDetailView />;
  }

  if (routePoints.length >= 2) {
    return <RunDetailOverview routePoints={routePoints} />;
  }

  return <RouteList />;
}

export default SidebarContent;
