"use client";

import { useAuthPermission } from "~/frontend/features/auth/components/hooks/useAuthPermission";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import RouteList from "~/frontend/features/route/components/RouteList";
import RunDetailOverview from "../RunDetailOverview";
import GuestSidebarContent from "./GuestSidebarContent";

function SidebarContent() {
  const { isAuthenticated } = useAuthPermission();
  const routePoints = useRoutePointsStore((state) => state.routePoints);

  if (!isAuthenticated) {
    return <GuestSidebarContent />;
  }

  if (routePoints.length >= 2) {
    return <RunDetailOverview routePoints={routePoints} />;
  }

  return <RouteList />;
}

export default SidebarContent;
