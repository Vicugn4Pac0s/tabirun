"use client";

import { useState } from "react";
import Link from "next/link";
import RouteMenuButton from "~/frontend/features/route/components/RouteMenuButton";
import { getRouteMenuLabel } from "../lib/getRouteMenuLabel";
import { Input } from "~/frontend/components/ui/input";
import { SidebarLayout } from "~/frontend/components/layout/SidebarLayout";
import { AuthUserMenu } from "~/frontend/features/auth/components/AuthUserMenu";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import RoutePointList from "~/frontend/features/route-points/components/RoutePointList";
import { RunMetricsPanel } from "~/frontend/features/run-metrics/components/RunMetricsPanel";
import { useRunEstimateInputs } from "~/frontend/features/run-metrics/hooks/useRunEstimateInputs";
import { useRoutePolylinePath } from "~/frontend/features/googlemap/hooks/useRoutePolylinePath";
import { Button } from "~/frontend/components/ui/button";

import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import RouteMapView from "./RouteMapView";
import { RouteNavigation } from "~/frontend/features/route-points/components/RouteNavigation";
import { WarningBanner } from "~/frontend/components/app-ui/WarningBanner";
import { getRouteCalculationWarningMessage } from "../lib/getRouteCalculationWarningMessage";
import type { RouterOutputs } from "~/trpc/react";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { useRouteEdit } from "../hooks/useRouteEdit";

type RouteEditScreenProps = {
  route: Pick<RouterOutputs["route"]["getById"], "id" | "title" | "points">;
};

function RouteEditScreenContent({ route }: RouteEditScreenProps) {
  const [selectedPoint, setSelectedPoint] =
    useState<google.maps.LatLngLiteral | null>(null);
  const {
    title,
    points,
    setTitle,
    togglePoint,
    isDirty,
    canSave,
    isUpdating,
    save,
    reset,
    confirmDiscard,
  } = useRouteEdit(route);
  const { polylinePath, directions, isLoading, error } = useRoutePolylinePath(
    points,
    { canUseDirections: true },
  );
  const warningMessage = getRouteCalculationWarningMessage(error, "editable");
  const { pace, setPace, weightKg } = useRunEstimateInputs();
  const moveStreetView = useMoveStreetView();
  return (
    <SidebarLayout
      sidebarTitle="ルート編集"
      mobileTrigger={
        <RouteMenuButton
          label={getRouteMenuLabel(directions?.distanceMeters, isLoading)}
          aria-label="ルート編集を開く"
        />
      }
      topRight={<AuthUserMenu />}
      sidebar={
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
          <label className="block text-sm font-medium">
            <span className="mb-2 block">ルート名</span>
            <Input
              disabled={isUpdating}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
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
          <div className="my-6 flex gap-2">
            <Button
              type="button"
              disabled={!canSave || isUpdating}
              onClick={() => {
                void save();
              }}
            >
              {isUpdating ? "更新中..." : "更新する"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty || isUpdating}
              onClick={reset}
            >
              リセット
            </Button>
          </div>
          {points.length < 2 && (
            <p role="status" className="mb-3 text-sm text-gray-500">
              保存するには2地点以上を登録してください。
            </p>
          )}
          <h2 className="mb-3 font-bold">経由地点（{points.length} 地点）</h2>
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
    </SidebarLayout>
  );
}

export function RouteEditScreen(props: RouteEditScreenProps) {
  return (
    <GoogleMapProvider>
      <RouteEditScreenContent {...props} />
    </GoogleMapProvider>
  );
}
