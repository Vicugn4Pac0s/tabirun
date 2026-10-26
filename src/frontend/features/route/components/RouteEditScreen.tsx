"use client";

import { useState } from "react";
import Link from "next/link";
import { getRouteMenuLabel } from "../lib/getRouteMenuLabel";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import RoutePointList from "~/frontend/features/route-points/components/RoutePointList";
import { RunMetricsPanel } from "~/frontend/features/run-metrics/components/RunMetricsPanel";
import { useRunEstimateInputs } from "~/frontend/features/run-metrics/hooks/useRunEstimateInputs";
import { useRoutePolylinePath } from "~/frontend/features/googlemap/hooks/useRoutePolylinePath";

import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import RouteMapView from "./RouteMapView";
import { RouteNavigation } from "~/frontend/features/route-points/components/RouteNavigation";
import { WarningBanner } from "~/frontend/components/app-ui/WarningBanner";
import { getRouteCalculationWarningMessage } from "../lib/getRouteCalculationWarningMessage";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { useRouteEdit } from "../hooks/useRouteEdit";
import type { RouteUpdateInput } from "~/shared/schemas";
import { RouteScreenLayout } from "./RouteScreenLayout";
import { RouteForm } from "./RouteForm";

type RouteEditScreenProps = {
  route: RouteUpdateInput;
};

function RouteEditScreenContent({ route }: RouteEditScreenProps) {
  const [selectedPoint, setSelectedPoint] =
    useState<google.maps.LatLngLiteral | null>(null);
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
      <div className="relative flex min-w-0 flex-1">
        <RouteMapView
          showStreetView
          initialCenter={route.points[0] ?? GOOGLE_MAP_DEFAULT_CENTER}
          path={polylinePath}
          markers={points.map((point, index) => ({
            id: String(index),
            position: point,
            label: String(index + 1),
            title: `地点 ${index + 1}`,
          }))}
          isLoading={isLoading}
          fitToRoute
          onSelectedPointChange={setSelectedPoint}
        />
        {selectedPoint && (
          <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 min-[1201px]:peer-data-[street-view=visible]:left-1/4">
            <RouteNavigation
              points={points}
              currentPoint={selectedPoint}
              onMove={(target) => {
                void moveStreetView(target).catch(() => undefined);
              }}
              onToggle={() => togglePoint(selectedPoint)}
              disabled={isUpdating}
            />
          </div>
        )}
      </div>
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
