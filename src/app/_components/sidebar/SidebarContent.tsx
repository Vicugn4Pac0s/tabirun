"use client";

import { Spinner } from "~/frontend/components/ui/spinner";
import { useAuthPermission } from "~/frontend/features/auth/components/hooks/useAuthPermission";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import RouteDetailView from "~/frontend/features/route/components/RouteDetailView";
import RouteList from "~/frontend/features/route/components/RouteList";
import { useSelectedRouteStore } from "~/frontend/features/route/stores/selectedRouteStore";
import RunDetailOverview from "~/frontend/features/run-detail/components/RunDetailOverview";
import GuestSidebarContent from "./GuestSidebarContent";

function SidebarContent() {
  const { isAuthenticated, isLoading } = useAuthPermission();
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const selectedRoute = useSelectedRouteStore((state) => state.selectedRoute);

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spinner className="size-6 text-gray-500" />
      </div>
    );
  }

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
