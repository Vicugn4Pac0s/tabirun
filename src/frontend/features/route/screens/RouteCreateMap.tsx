"use client";

import { useId, useRef, useState } from "react";
import { GuardedLink } from "~/frontend/providers/GuardedLink";
import { getRouteMenuLabel } from "../lib/getRouteMenuLabel";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import RoutePointList from "~/frontend/features/route-points/components/RoutePointList";
import { RunMetricsPanel } from "~/frontend/features/run-metrics/components/RunMetricsPanel";
import { useRunEstimateInputs } from "~/frontend/features/run-metrics/hooks/useRunEstimateInputs";
import { useRoutePolylinePath } from "~/frontend/features/googlemap/hooks/useRoutePolylinePath";

import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { getRouteCalculationWarningMessage } from "../lib/getRouteCalculationWarningMessage";
import { useRouteCreateMap } from "../hooks/useRouteCreateMap";
import { RouteScreenLayout } from "../components/RouteScreenLayout";
import { RouteDraftList } from "../components/RouteDraftList";
import { Button } from "~/frontend/components/ui/button";
import { RouteMap } from "../components/RouteMap";

import RouteMenuButton from "../components/RouteMenuButton";
import { RouteSidebar } from "../components/RouteSidebar";

type RouteCreateMapProps = { defaultCenter: google.maps.LatLngLiteral };

function RouteCreateMapContent({ defaultCenter }: RouteCreateMapProps) {
  const { draft, isCreating, save } = useRouteCreateMap();
  const { points, togglePoint, confirmDiscard } = draft;
  const { polylinePath, directions, isLoading, error } = useRoutePolylinePath(
    points,
    { canUseDirections: true },
  );
  const warningMessage = getRouteCalculationWarningMessage(error, "editable");
  const { pace, setPace, weightKg } = useRunEstimateInputs();
  const moveStreetView = useMoveStreetView();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarTriggerRef = useRef<HTMLButtonElement>(null);
  const sidebarId = useId();
  return (
    <RouteScreenLayout
      confirmNavigation={() => !isCreating && confirmDiscard()}
      sidebar={
        <RouteSidebar
          id={sidebarId}
          title="ルート作成"
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          triggerRef={sidebarTriggerRef}
        >
          <GuardedLink
            href="/"
            className="mb-5 inline-block font-medium underline"
            aria-disabled={isCreating}
          >
            ホームへ戻る
          </GuardedLink>
          <h1 className="mb-4 text-xl font-bold">ルートを作成</h1>
          <RouteDraftList />
          <p className="mt-2 text-sm text-gray-500">
            画面下部のボタンで地点を追加・削除できます。
          </p>
          <RunMetricsPanel
            distanceMeters={directions?.distanceMeters}
            isLoading={isLoading}
            pace={pace}
            onPaceChange={setPace}
            weightKg={weightKg}
          />

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
        </RouteSidebar>
      }
    >
      <RouteMap
        initialCenter={defaultCenter}
        path={polylinePath}
        markers={points.map((point, index) => ({
          id: String(index),
          position: point,
          label: String(index + 1),
          title: `地点 ${index + 1}`,
        }))}
        isLoading={isLoading}
        topLeft={
          <RouteMenuButton
            ref={sidebarTriggerRef}
            label={getRouteMenuLabel(directions?.distanceMeters, isLoading)}
            aria-label={`ルート作成を${sidebarOpen ? "閉じる" : "開く"}`}
            aria-controls={sidebarId}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((value) => !value)}
          />
        }
        topRight={
          <>
            <Button
              type="button"
              onClick={() => {
                void save();
              }}
              disabled={!draft.canSave || draft.isSubmitting || isCreating}
            >
              {draft.isSubmitting || isCreating
                ? "保存中..."
                : "詳細入力へ進む"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!draft.isDirty || draft.isSubmitting || isCreating}
              onClick={draft.reset}
            >
              リセット
            </Button>
          </>
        }
        warning={warningMessage}
        editing={{
          points,
          disabled: draft.isSubmitting || isCreating,
          onTogglePoint: togglePoint,
        }}
      />
    </RouteScreenLayout>
  );
}

/**
 * 地図で地点を選ぶルート作成画面を、専用のGoogleMapProviderで包んで表示する。
 * 未保存の変更がある移動には破棄確認を行い、保存中の移動を抑止する。
 */
export function RouteCreateMap(props: RouteCreateMapProps) {
  return (
    <GoogleMapProvider>
      <RouteCreateMapContent {...props} />
    </GoogleMapProvider>
  );
}
