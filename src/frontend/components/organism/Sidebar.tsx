'use client';
import { useRoutePointsStore } from "~/frontend/stores/googlemap/routePointsStore";
import RunRouteList from "./RunRouteList";
import RunDetailOverview from "./RunDetailOverview";

function Sidebar() {
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  
  return (
    <div className="p-5">
      {routePoints.length === 0 ? (
        <RunRouteList routePoints={routePoints} />
      ) : (
        <RunDetailOverview routePoints={routePoints} />
      )}
    </div>
  )
}

export default Sidebar