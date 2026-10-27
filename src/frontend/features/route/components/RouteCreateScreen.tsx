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
import { useRouteCreation } from "../hooks/useRouteCreation";
import { RouteScreenLayout } from "./RouteScreenLayout";
import { RouteForm } from "./RouteForm";
import { RouteEditorMap } from "./RouteEditorMap";

type RouteCreateScreenProps = { defaultCenter: google.maps.LatLngLiteral };

function RouteCreateScreenContent({ defaultCenter }: RouteCreateScreenProps) {
  const { draft, isCreating, save } = useRouteCreation();
  const { points, togglePoint, confirmDiscard } = draft;
  const { polylinePath, directions, isLoading, error } = useRoutePolylinePath(
    points,
    { canUseDirections: true },
  );
  const warningMessage = getRouteCalculationWarningMessage(error, "editable");
  const { pace, setPace, weightKg } = useRunEstimateInputs();
  const moveStreetView = useMoveStreetView();
  return (
    <RouteScreenLayout
      panelTitle="ルート作成"
      menuTriggerLabel={getRouteMenuLabel(
        directions?.distanceMeters,
        isLoading,
      )}
      panel={
        <>
          <Link
            href="/"
            className="mb-5 inline-block font-medium underline"
            onClick={(event) => {
              if (isCreating || !confirmDiscard()) event.preventDefault();
            }}
            aria-disabled={isCreating}
          >
            ホームへ戻る
          </Link>
          <h1 className="mb-4 text-xl font-bold">ルートを作成</h1>
          <RouteForm
            draft={draft}
            onSubmit={save}
            submitText={{ idle: "ルートを保存する", pending: "保存中..." }}
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
        initialCenter={defaultCenter}
        points={points}
        polylinePath={polylinePath}
        isLoading={isLoading}
        disabled={isCreating}
        onTogglePoint={togglePoint}
      />
    </RouteScreenLayout>
  );
}

export function RouteCreateScreen(props: RouteCreateScreenProps) {
  return (
    <GoogleMapProvider>
      <RouteCreateScreenContent {...props} />
    </GoogleMapProvider>
  );
}
