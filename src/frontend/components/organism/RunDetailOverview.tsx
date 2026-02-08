'use client';

import { calcCaloriesFromRun, calcTimeFromDistanceAndPace, metersToKilometers, Pace } from "~/shared/helpers/calc";
import { useState } from "react";
import useGooglemapDirection from "~/frontend/hooks/api/useGooglemapDirection";
import useStreetViewPanorama from "~/frontend/hooks/googlemap/useStreetViewPanorama";
import { useRoutePointsStore } from "~/frontend/stores/googlemap/routePointsStore";
import { Selectbox } from "../atoms/Selectbox";
import { StatValue } from "../atoms/StatValue";
import RoutePointListItem from "../molecule/RoutePointListItem";

function RunDetailOverview() {
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const { directions, isLoading, error } = useGooglemapDirection(routePoints);
  const { moveStreetViewPanorama } = useStreetViewPanorama();

  const [selectedPace, setSelectedPace] = useState<Pace>("5:00");

  const kilometers = directions?.distanceMeters ? metersToKilometers(directions.distanceMeters) : 0;
  const time =  kilometers && calcTimeFromDistanceAndPace(kilometers, selectedPace)
  const calories =  calcCaloriesFromRun(60, kilometers, selectedPace);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <p className="font-bold text-base-gray mb-2">ペース</p>
        <Selectbox items={[
          { value: '4:00', label: '4:00' },
          { value: '5:00', label: '5:00' },
          { value: '6:00', label: '6:00' },
          { value: '7:00', label: '7:00' },
          { value: '8:00', label: '8:00' },
        ]} value={selectedPace} onValueChange={(value) => setSelectedPace(value as Pace)} className="w-full"/>
      </div>
      {kilometers ? (
        <ul className="grid grid-cols-2 gap-2 text-center mb-6">
          <li>
            <StatValue value={kilometers} unit="KM" className="text-base-gray text-2xl" />
          </li>
          <li>
            <StatValue value={time} className="text-base-gray text-2xl" />
          </li>
          <li>
            <StatValue value={calories} unit="KCAL" className="text-base-gray text-2xl" />
          </li>
        </ul>
      ) : null}
      {routePoints && (
        <ul>
          {routePoints.map((point, index) => (
            <li key={index} className="mb-2">
              <RoutePointListItem routePoint={point} index={index} onClick={(_) => moveStreetViewPanorama(point)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default RunDetailOverview