'use client';

import { useRouteDirectionsData } from "~/frontend/hooks/googlemap/useRouteDirectionsData";
import { useRoutePointsStore } from "~/frontend/stores/googlemap/routePointsStore";
import { Selectbox } from "../atoms/Selectbox";
import { StatValue } from "../atoms/StatValue";

type Pace = `${number}:${number}`;

/**
 * 距離(km) と キロペース(mm:ss) から 総時間(hh:mm:ss) を計算
 */
export function calcTimeFromDistanceAndPace(
  distanceKm: number,
  pace: Pace
): string {
  const [paceMin, paceSec] = pace.split(":").map(Number);
  console.log(  {paceMin, paceSec});
  if(paceMin === undefined || paceSec === undefined) return "0:00";
  const paceInSeconds = paceMin * 60 + paceSec;
  const totalSeconds = Math.round(distanceKm * paceInSeconds);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = hours > 0 ? `${hours}:` : "00:";
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${hh}${mm}:${ss}`;
}

function RunDetailOverview() {
  const { meta } = useRouteDirectionsData();
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  
  return (
    <div>
      <div className="mb-6">
        <p className="font-bold text-base-gray mb-2">ペース</p>
        <Selectbox items={[
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' },
        ]} className="w-full"/>
      </div>
      {meta && (
        <ul className="grid grid-cols-2 text-center mb-6">
          <li>
            <StatValue value={meta.distanceKm} unit="KM" className="text-base-gray text-2xl" />
          </li>
          <li>
            <StatValue value={calcTimeFromDistanceAndPace(meta.distanceKm, "5:00")} className="text-base-gray text-2xl" />
          </li>
        </ul>
      )}
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