'use client';

import { useRouteDirectionsData } from "~/frontend/hooks/googlemap/useRouteDirectionsData";
import { useRoutePointsStore } from "~/frontend/stores/googlemap/routePointsStore";
import { Selectbox } from "../atoms/Selectbox";

function RunDetailOverview() {
  const { meta } = useRouteDirectionsData();
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  
  return (
    <div>
      <Selectbox />
      {meta && (
        <p>{meta.distanceKm}KM</p>
      )}
      {routePoints && (
        <p>Number of Route Points: {routePoints.length}</p>
      )}
    </div>
  )
}

export default RunDetailOverview