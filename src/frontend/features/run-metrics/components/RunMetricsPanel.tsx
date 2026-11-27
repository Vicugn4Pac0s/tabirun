import { StatValue } from "~/frontend/components/app-ui/StatValue";
import { FormField } from "~/frontend/components/app-ui/FormField";
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

/**
 * 距離とペースから予想時間・消費カロリーを表示する。体重未指定時は60kgで試算する。
 * km換算して丸めた距離が正でなければ、計測中または表示不可の案内に切り替える。
 */
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
    <section aria-label="ランニングの試算" className="space-y-6">
      {distanceKm > 0 ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
          <div className="col-span-2 space-y-2">
            <dt className="text-xs text-muted-foreground">距離</dt>
            <dd>
              <StatValue
                value={distanceKm}
                unit="km"
                className="text-[2rem] italic leading-8 text-primary"
              />
            </dd>
          </div>
          <div className="min-w-0 space-y-2">
            <dt className="text-xs text-muted-foreground">予想時間</dt>
            <dd>
              <StatValue
                value={calcTimeFromDistanceAndPace(distanceKm, pace)}
                className="text-2xl leading-8"
              />
            </dd>
          </div>
          <div className="min-w-0 space-y-2">
            <dt className="text-xs text-muted-foreground">消費カロリー</dt>
            <dd>
              <StatValue
                value={calcCaloriesFromRun(
                  weightKg ?? DEFAULT_WEIGHT_KG,
                  distanceKm,
                  pace,
                )}
                unit="kcal"
                className="text-2xl leading-8"
              />
            </dd>
          </div>
        </dl>
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          {isLoading ? "距離を計測中..." : "距離を表示できません。"}
        </p>
      )}
      <div className="border-t pt-6">
        <FormField label="ペース">
          {(fieldProps) => (
            <PaceSelect
              {...fieldProps}
              value={pace}
              onChangeValue={onPaceChange}
              className="w-full"
            />
          )}
        </FormField>
      </div>
    </section>
  );
}
