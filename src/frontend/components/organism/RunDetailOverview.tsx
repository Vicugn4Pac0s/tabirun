'use client';

import { calcCaloriesFromRun, calcTimeFromDistanceAndPace, metersToKilometers } from "~/shared/helpers/calc";
import useGooglemapDirection from "~/frontend/hooks/api/useGooglemapDirection";
import { useRoutePointsStore } from "~/frontend/stores/googlemap/routePointsStore";
import { Selectbox } from "../atoms/Selectbox";
import { StatValue } from "../atoms/StatValue";

function RunDetailOverview() {
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const { directions } = useGooglemapDirection(routePoints);

  const kilometers = directions?.distanceMeters ? metersToKilometers(directions.distanceMeters) : 0;
  const time =  kilometers && calcTimeFromDistanceAndPace(kilometers, "5:00")
  const calories =  calcCaloriesFromRun(60, kilometers, "5:00");

  return (
    <div>
      <div className="mb-6">
        <p className="font-bold text-base-gray mb-2">ペース</p>
        <Selectbox items={[
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' },
        ]} className="w-full"/>
      </div>
      {kilometers ? (
        <ul className="grid grid-cols-2 text-center mb-6">
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
            <li key={index} className="border-base-gray-light border rounded-md px-2 py-1 mb-2">
              <p>地点{index + 1}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default RunDetailOverview