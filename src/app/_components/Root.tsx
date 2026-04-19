"use client";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import Sidebar from "~/frontend/components/layout/Sidebar";
import MapScreen from "./MapScreen";
import { UserMenu } from "~/frontend/features/auth/components/UserMenu";
import RouteList from "~/frontend/features/route/components/RouteList";
import RunDetailOverview from "./RunDetailOverview";

function Root() {
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  return (
    <div className="flex">
      <div className="w-72">
        <Sidebar>
          {routePoints.length >= 2 ? (
            <RunDetailOverview routePoints={routePoints} />
          ): (
            <RouteList />
          )}
        </Sidebar>
      </div>
      <MapScreen />
      <div className="absolute top-3 right-3 z-50">
        <UserMenu />
      </div>
    </div>
  );
}

export default Root;
