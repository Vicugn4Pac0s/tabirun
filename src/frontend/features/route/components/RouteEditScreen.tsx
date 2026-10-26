"use client";

import Link from "next/link";
import { getRouteMenuLabel } from "../lib/getRouteMenuLabel";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import RoutePointList from "~/frontend/features/route-points/components/RoutePointList";
import { RunMetricsPanel } from "~/frontend/features/run-metrics/components/RunMetricsPanel";
import { useRunEstimateInputs } from "~/frontend/features/run-metrics/hooks/useRunEstimateInputs";
import { useRoutePolylinePath } from "~/frontend/features/googlemap/hooks/useRoutePolylinePath";

import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { WarningBanner } from "~/frontend/components/app-ui/WarningBanner";
import { getRouteCalculationWarningMessage } from "../lib/getRouteCalculationWarningMessage";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { useRouteEdit } from "../hooks/useRouteEdit";
import type { RouteUpdateInput } from "~/shared/schemas";
import { RouteScreenLayout } from "./RouteScreenLayout";
import { RouteForm } from "./RouteForm";
import { RouteEditorMap } from "./RouteEditorMap";

type RouteEditScreenProps = {
  route: RouteUpdateInput;
};

function RouteEditScreenContent({ route }: RouteEditScreenProps) {
  const draft = useRouteEdit(route);
  const { points, togglePoint, isUpdating, save, confirmDiscard } = draft;
  const { polylinePath, directions, isLoading, error } = useRoutePolylinePath(
    points,
    { canUseDirections: true },
  );
  const warningMessage = getRouteCalculationWarningMessage(error, "editable");
  const { pace, setPace, weightKg } = useRunEstimateInputs();
  const moveStreetView = useMoveStreetView();
  return (
    <RouteScreenLayout
      panelTitle="ルート編集"
      menuTriggerLabel={getRouteMenuLabel(
        directions?.distanceMeters,
        isLoading,
      )}
      panel={
        <>
          <Link
            href={`/routes/${route.id}`}
            className="mb-5 inline-block font-medium underline"
            onClick={(event) => {
              if (isUpdating || !confirmDiscard()) event.preventDefault();
            }}
            aria-disabled={isUpdating}
          >
            ルートに戻る
          </Link>
          <h1 className="mb-4 text-xl font-bold">ルートを編集</h1>
          <RouteForm
            draft={draft}
            onSubmit={save}
            isSaving={isUpdating}
            submitText={{ idle: "更新する", pending: "更新中..." }}
          >
            <p className="mt-2 text-sm text-gray-500">
              Street View下部のボタンで地点を追加・削除できます。
            </p>
            {warningMessage && (
              <div className="mb-4">
                <WarningBanner>{warningMessage}</WarningBanner>
              </div>
            )}
            <RunMetricsPanel
              distanceMeters={directions?.distanceMeters}
              isLoading={isLoading}
              pace={pace}
              onPaceChange={setPace}
              weightKg={weightKg}
            />
          </RouteForm>
          {points.length < 2 && (
            <p role="status" className="mb-3 text-sm text-gray-500">
              保存するには2地点以上を登録してください。
            </p>
          )}
          <RoutePointList
            routePoints={points}
            onRoutePointClick={(point) => {
              void moveStreetView(point).catch(() => undefined);
            }}
          />
        </>
      }
    >
      <RouteEditorMap
        initialCenter={route.points[0] ?? GOOGLE_MAP_DEFAULT_CENTER}
        points={points}
        polylinePath={polylinePath}
        isLoading={isLoading}
        disabled={isUpdating}
        fitToRoute
        onTogglePoint={togglePoint}
      />
    </RouteScreenLayout>
  );
}

export function RouteEditScreen(props: RouteEditScreenProps) {
  return (
    <GoogleMapProvider>
      <RouteEditScreenContent {...props} />
    </GoogleMapProvider>
  );
}
