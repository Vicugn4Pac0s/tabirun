import { StatValue } from "~/frontend/components/app-ui/StatValue";
import {
  calcCaloriesFromRun,
  calcTimeFromDistanceAndPace,
} from "~/frontend/lib/running";
import { type Pace } from "~/frontend/types/pace";

type RouteCalculatedStatsProps = {
  pace: Pace;
  distanceKm: number;
  weightKg?: number | null;
};

const DEFAULT_WEIGHT_KG = 60;

export function RouteCalculatedStats({
  pace,
  distanceKm,
  weightKg,
}: RouteCalculatedStatsProps) {
  if (!distanceKm) {
    return null;
  }

  const time = calcTimeFromDistanceAndPace(distanceKm, pace);
  const calories = calcCaloriesFromRun(
    weightKg ?? DEFAULT_WEIGHT_KG,
    distanceKm,
    pace,
  );

  return (
    <ul className="mb-6 grid grid-cols-2 gap-2 text-center">
      <li>
        <StatValue value={distanceKm} unit="KM" className="text-2xl text-base-gray" />
      </li>
      <li>
        <StatValue value={time} className="text-2xl text-base-gray" />
      </li>
      <li>
        <StatValue value={calories} unit="KCAL" className="text-2xl text-base-gray" />
      </li>
    </ul>
  );
}
