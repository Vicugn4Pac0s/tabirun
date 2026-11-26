"use client";

import Link from "next/link";
import { getRouteMenuLabel } from "../lib/getRouteMenuLabel";
import type { RouterOutputs } from "~/trpc/react";
import { WarningBanner } from "~/frontend/components/app-ui/WarningBanner";
import { getRouteCalculationWarningMessage } from "../lib/getRouteCalculationWarningMessage";
import RouteMapView from "./RouteMapView";
import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { RunMetricsPanel } from "~/frontend/features/run-metrics/components/RunMetricsPanel";
import { useRunEstimateInputs } from "~/frontend/features/run-metrics/hooks/useRunEstimateInputs";
import { getRoutePreviewMarkers } from "../lib/getRoutePreviewMarkers";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { RouteScreenLayout } from "./RouteScreenLayout";

type RoutePreviewScreenProps = {
  route: Pick<
    RouterOutputs["route"]["getById"],
    "id" | "title" | "points" | "direction" | "directionErrorCode"
  >;
};

function RoutePreviewScreenContent({ route }: RoutePreviewScreenProps) {
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
  return (
    <RouteScreenLayout
      panelTitle="ルート情報"
      menuTriggerLabel={getRouteMenuLabel(direction?.distanceMeters, false)}
      panel={
        <>
          <Link
            href={`/routes/${route.id}`}
            className="mb-5 inline-block font-medium underline"
          >
            ルート詳細に戻る
          </Link>
          <p className="text-sm text-muted-foreground">保存済みルート</p>
          <h1 className="mb-4 mt-2 break-words text-xl font-bold">
            {route.title}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            地図上の位置を選んで、Street Viewで下見できます。
          </p>
          {warningMessage && (
            <div className="mb-4">
              <WarningBanner>{warningMessage}</WarningBanner>
            </div>
          )}
          <RunMetricsPanel
            distanceMeters={direction?.distanceMeters}
            isLoading={false}
            pace={pace}
            onPaceChange={setPace}
            weightKg={weightKg}
          />
        </>
      }
    >
      <RouteMapView
        showStreetView
        initialCenter={route.points[0] ?? GOOGLE_MAP_DEFAULT_CENTER}
        path={direction?.path ?? null}
        markers={markers}
        fitToRoute
      />
    </RouteScreenLayout>
  );
}

/**
 * 保存済み経路の地図とStreet Viewによる下見画面を表示する。
 * 経路取得失敗や上限到達は警告として表示し、登録地点の下見は続けられる。
 */
export function RoutePreviewScreen(props: RoutePreviewScreenProps) {
  return (
    <GoogleMapProvider>
      <RoutePreviewScreenContent {...props} />
    </GoogleMapProvider>
  );
}
