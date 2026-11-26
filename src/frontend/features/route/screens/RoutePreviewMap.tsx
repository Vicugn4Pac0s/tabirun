"use client";

import { useId, useRef, useState } from "react";
import { getRouteMenuLabel } from "../lib/getRouteMenuLabel";
import type { RouterOutputs } from "~/trpc/react";
import { getRouteCalculationWarningMessage } from "../lib/getRouteCalculationWarningMessage";
import { RouteMap } from "../components/RouteMap";
import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { RunMetricsPanel } from "~/frontend/features/run-metrics/components/RunMetricsPanel";
import { useRunEstimateInputs } from "~/frontend/features/run-metrics/hooks/useRunEstimateInputs";
import { getRoutePreviewMarkers } from "../lib/getRoutePreviewMarkers";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { RouteScreenLayout } from "../components/RouteScreenLayout";

import RouteMenuButton from "../components/RouteMenuButton";
import { RouteSidebar } from "../components/RouteSidebar";

type RoutePreviewMapProps = {
  route: Pick<
    RouterOutputs["route"]["getById"],
    "id" | "title" | "points" | "direction" | "directionErrorCode"
  >;
};

function RoutePreviewMapContent({ route }: RoutePreviewMapProps) {
  const { pace, setPace, weightKg } = useRunEstimateInputs();
  const { direction, directionErrorCode } = route;
  const warningCode =
    direction?.directionSource === "straight_line"
      ? "TOO_MANY_REQUESTS"
      : directionErrorCode;
  const warningMessage = getRouteCalculationWarningMessage(
    warningCode ? { data: { code: warningCode } } : null,
    "saved",
  );
  const start = route.points[0];
  const goal = route.points[route.points.length - 1];
  const markers = getRoutePreviewMarkers(start, goal);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarTriggerRef = useRef<HTMLButtonElement>(null);
  const sidebarId = useId();
  return (
    <RouteScreenLayout
      sidebar={
        <RouteSidebar
          id={sidebarId}
          title="ルート情報"
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          triggerRef={sidebarTriggerRef}
        >
          <RunMetricsPanel
            distanceMeters={direction?.distanceMeters}
            isLoading={false}
            pace={pace}
            onPaceChange={setPace}
            weightKg={weightKg}
          />
        </RouteSidebar>
      }
    >
      <h1 className="sr-only">{route.title}</h1>
      <RouteMap
        initialCenter={route.points[0] ?? GOOGLE_MAP_DEFAULT_CENTER}
        path={direction?.path ?? null}
        markers={markers}
        fitToRoute
        topLeft={
          <RouteMenuButton
            ref={sidebarTriggerRef}
            label={getRouteMenuLabel(direction?.distanceMeters, false)}
            aria-label={`ルート情報を${sidebarOpen ? "閉じる" : "開く"}`}
            aria-controls={sidebarId}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((value) => !value)}
          />
        }
        warning={warningMessage}
      />
    </RouteScreenLayout>
  );
}

/**
 * 保存済み経路の地図とStreet Viewによる下見画面を表示する。
 * 経路取得失敗や上限到達は警告として表示し、登録地点の下見は続けられる。
 */
export function RoutePreviewMap(props: RoutePreviewMapProps) {
  return (
    <GoogleMapProvider>
      <RoutePreviewMapContent {...props} />
    </GoogleMapProvider>
  );
}
