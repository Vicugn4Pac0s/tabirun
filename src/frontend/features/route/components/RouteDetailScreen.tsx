"use client";

import Link from "next/link";
import { Button } from "~/frontend/components/ui/button";
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
import { useRouteDeletion } from "../hooks/useRouteDeletion";
import { RouteScreenLayout } from "./RouteScreenLayout";

type RouteDetailScreenProps = {
  route: Pick<
    RouterOutputs["route"]["getById"],
    "id" | "title" | "points" | "direction" | "directionErrorCode"
  >;
};

function RouteDetailScreenContent({ route }: RouteDetailScreenProps) {
  const { remove, isDeleting } = useRouteDeletion(route.id);
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
          <Link href="/" className="mb-5 inline-block font-medium underline">
            ホームへ戻る
          </Link>
          <p className="text-sm text-gray-500">保存済みルート</p>
          <h1 className="mb-4 mt-2 break-words text-xl font-bold">
            {route.title}
          </h1>
          <div className="mb-4 flex gap-2">
            <Link
              href={`/routes/${route.id}/edit`}
              className="inline-block rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50"
              aria-disabled={isDeleting}
              onClick={(event) => {
                if (isDeleting) event.preventDefault();
              }}
            >
              編集する
            </Link>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                void remove();
              }}
            >
              {isDeleting ? "削除中..." : "削除する"}
            </Button>
          </div>
          <p className="mb-6 text-sm text-gray-600">
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

export function RouteDetailScreen(props: RouteDetailScreenProps) {
  return (
    <GoogleMapProvider>
      <RouteDetailScreenContent {...props} />
    </GoogleMapProvider>
  );
}
