'use client';

import { useRouteDirectionsData } from "~/frontend/hooks/googlemap/useRouteDirectionsData";
import { useRoutePointsStore } from "~/frontend/stores/googlemap/routePointsStore";
import { Selectbox } from "../atoms/Selectbox";
import { StatValue } from "../atoms/StatValue";

function RunDetailOverview() {
  const { meta } = useRouteDirectionsData();
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  
  return (
    <div>
      <Selectbox items={[
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ]}/>
      {meta && (
        <StatValue value={meta.distanceKm} unit="KM" className="text-base-gray text-2xl" />
      )}
      {routePoints && (
        <p>Number of Route Points: {routePoints.length}</p>
      )}
    </div>
  )
}

export default RunDetailOverview