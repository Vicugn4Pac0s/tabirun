"use client";

import { useId, useRef, useState } from "react";
import { getRouteMenuLabel } from "../lib/getRouteMenuLabel";
import { RunMetricsPanel } from "~/frontend/features/run-metrics/components/RunMetricsPanel";
import { useRunEstimateInputs } from "~/frontend/features/run-metrics/hooks/useRunEstimateInputs";
import { useRoutePolylinePath } from "~/frontend/features/googlemap/hooks/useRoutePolylinePath";

import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { getRouteCalculationWarningMessage } from "../lib/getRouteCalculationWarningMessage";
import { useRouteCreateMap } from "../hooks/useRouteCreateMap";
import { RouteScreenLayout } from "../components/RouteScreenLayout";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarTriggerRef = useRef<HTMLButtonElement>(null);
  const sidebarId = useId();
  return (
    <RouteScreenLayout
      confirmNavigation={() => !isCreating && confirmDiscard()}
      sidebar={
        <RouteSidebar
          id={sidebarId}
          title="ルート情報"
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          triggerRef={sidebarTriggerRef}
        >
          <RunMetricsPanel
            distanceMeters={directions?.distanceMeters}
            isLoading={isLoading}
            pace={pace}
            onPaceChange={setPace}
            weightKg={weightKg}
          />
        </RouteSidebar>
      }
    >
      <h1 className="sr-only">ルートを作成</h1>
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
            aria-label={`ルート情報を${sidebarOpen ? "閉じる" : "開く"}`}
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
