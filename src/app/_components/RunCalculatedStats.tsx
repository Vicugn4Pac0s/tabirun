import { StatValue } from "~/frontend/components/app-ui/StatValue";
import {
  calcCaloriesFromRun,
  calcTimeFromDistanceAndPace,
} from "~/frontend/lib/running";
import { type Pace } from "~/frontend/types/pace";

type RunCalculatedStatsProps = {
  pace: Pace;
  distanceKm: number;
  weightKg?: number | null;
};

const DEFAULT_WEIGHT_KG = 60;

export function RunCalculatedStats({
  pace,
  distanceKm,
  weightKg,
}: RunCalculatedStatsProps) {
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
    <ul className="grid grid-cols-2 gap-2 text-center mb-6">
      <li>
        <StatValue value={distanceKm} unit="KM" className="text-base-gray text-2xl" />
      </li>
      <li>
        <StatValue value={time} className="text-base-gray text-2xl" />
      </li>
      <li>
        <StatValue value={calories} unit="KCAL" className="text-base-gray text-2xl" />
      </li>
    </ul>
  );
}
