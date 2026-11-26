"use client";

import { GuardedLink } from "~/frontend/providers/GuardedLink";
import { getRouteMenuLabel } from "../lib/getRouteMenuLabel";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import RoutePointList from "~/frontend/features/route-points/components/RoutePointList";
import { RunMetricsPanel } from "~/frontend/features/run-metrics/components/RunMetricsPanel";
import { useRunEstimateInputs } from "~/frontend/features/run-metrics/hooks/useRunEstimateInputs";
import { useRouteEditDirection } from "../hooks/useRouteEditDirection";

import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { WarningBanner } from "~/frontend/components/app-ui/WarningBanner";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { useRouteEditMap } from "../hooks/useRouteEditMap";
import type { RouterOutputs } from "~/trpc/react";
import { RouteScreenLayout } from "../components/RouteScreenLayout";
import { Button } from "~/frontend/components/ui/button";
import { RouteEditorMap } from "../components/RouteEditorMap";

type RouteEditMapProps = {
  route: Pick<
    RouterOutputs["route"]["getById"],
    "id" | "status" | "points" | "direction" | "directionErrorCode"
  >;
};

function RouteEditMapContent({ route }: RouteEditMapProps) {
  const { draft, isUpdating, save } = useRouteEditMap(route);
  const { points, togglePoint, confirmDiscard } = draft;
  const { polylinePath, directions, isLoading, warningMessage } =
    useRouteEditDirection(route, points);
  const { pace, setPace, weightKg } = useRunEstimateInputs();
  const moveStreetView = useMoveStreetView();
  return (
    <RouteScreenLayout
      confirmNavigation={() => !isUpdating && confirmDiscard()}
      panelTitle="ルート編集"
      menuTriggerLabel={getRouteMenuLabel(
        directions?.distanceMeters,
        isLoading,
      )}
      panel={
        <>
          <GuardedLink
            href={`/routes/${route.id}${route.status === "draft" ? "/details" : ""}`}
            className="mb-5 inline-block font-medium underline"
            aria-disabled={isUpdating}
          >
            {route.status === "draft" ? "詳細入力に戻る" : "ルートに戻る"}
          </GuardedLink>
          <h1 className="mb-4 text-xl font-bold">ルートを編集</h1>
          <form
            onSubmit={(event) => {
              void save(event);
            }}
          >
            <p className="mt-2 text-sm text-gray-500">
              画面下部のボタンで地点を追加・削除できます。
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
            <div className="my-6 flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={!draft.canSave || draft.isSubmitting || isUpdating}
              >
                {draft.isSubmitting || isUpdating ? "更新中..." : "更新する"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!draft.isDirty || draft.isSubmitting || isUpdating}
                onClick={draft.reset}
              >
                リセット
              </Button>
            </div>
          </form>
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

/**
 * 保存済みルートの編集画面を、専用のGoogleMapProviderで包んで表示する。
 * 初期編集値は初回のrouteを使うため、別ルートへ切り替える際は呼出側で再マウントする。
 */
export function RouteEditMap(props: RouteEditMapProps) {
  return (
    <GoogleMapProvider>
      <RouteEditMapContent {...props} />
    </GoogleMapProvider>
  );
}
