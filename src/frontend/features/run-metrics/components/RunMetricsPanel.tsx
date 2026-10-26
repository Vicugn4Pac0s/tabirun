import { StatValue } from "~/frontend/components/app-ui/StatValue";
import PaceSelect from "~/frontend/features/pace/components/PaceSelect";
import {
  calcCaloriesFromRun,
  calcTimeFromDistanceAndPace,
  metersToKilometers,
} from "~/frontend/lib/running";
import type { Pace } from "~/frontend/types/pace";

const DEFAULT_WEIGHT_KG = 60;

type RunMetricsPanelProps = {
  distanceMeters: number | null | undefined;
  isLoading: boolean;
  pace: Pace;
  onPaceChange: (pace: Pace) => void;
  weightKg?: number | null;
};

export function RunMetricsPanel({
  distanceMeters,
  isLoading,
  pace,
  onPaceChange,
  weightKg,
}: RunMetricsPanelProps) {
  const distanceKm =
    distanceMeters != null ? metersToKilometers(distanceMeters) : 0;

  return (
    <section aria-label="ランニングの試算" className="mb-6">
      <div className="mb-6">
        <p className="mb-2 font-bold text-base-gray">ペース</p>
        <PaceSelect
          value={pace}
          onChangeValue={onPaceChange}
          className="w-full"
        />
      </div>
      {distanceKm > 0 ? (
        <dl className="grid grid-cols-2 gap-2 text-center">
          <div>
            <dt className="text-sm text-gray-500">距離</dt>
            <dd>
              <StatValue
                value={distanceKm}
                unit="KM"
                className="text-2xl text-base-gray"
              />
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">予想時間</dt>
            <dd>
              <StatValue
                value={calcTimeFromDistanceAndPace(distanceKm, pace)}
                className="text-2xl text-base-gray"
              />
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">消費カロリー</dt>
            <dd>
              <StatValue
                value={calcCaloriesFromRun(
                  weightKg ?? DEFAULT_WEIGHT_KG,
                  distanceKm,
                  pace,
                )}
                unit="KCAL"
                className="text-2xl text-base-gray"
              />
            </dd>
          </div>
        </dl>
      ) : (
        <p role="status" className="text-sm text-gray-500">
          {isLoading ? "距離を計測中..." : "距離を表示できません。"}
        </p>
      )}
    </section>
  );
}
