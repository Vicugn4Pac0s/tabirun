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
import { useRouteEdit } from "../hooks/useRouteEdit";
import type { RouterOutputs } from "~/trpc/react";
import { RouteScreenLayout } from "./RouteScreenLayout";
import { RouteForm } from "./RouteForm";
import { RouteEditorMap } from "./RouteEditorMap";

type RouteEditScreenProps = {
  route: Pick<
    RouterOutputs["route"]["getById"],
    "id" | "title" | "points" | "direction" | "directionErrorCode"
  >;
};

function RouteEditScreenContent({ route }: RouteEditScreenProps) {
  const { draft, isUpdating, save } = useRouteEdit(route);
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
            href={`/routes/${route.id}`}
            className="mb-5 inline-block font-medium underline"
            aria-disabled={isUpdating}
          >
            ルートに戻る
          </GuardedLink>
          <h1 className="mb-4 text-xl font-bold">ルートを編集</h1>
          <RouteForm
            draft={draft}
            onSubmit={save}
            submitText={{ idle: "更新する", pending: "更新中..." }}
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

/**
 * 保存済みルートの編集画面を、専用のGoogleMapProviderで包んで表示する。
 * 初期編集値は初回のrouteを使うため、別ルートへ切り替える際は呼出側で再マウントする。
 */
export function RouteEditScreen(props: RouteEditScreenProps) {
  return (
    <GoogleMapProvider>
      <RouteEditScreenContent {...props} />
    </GoogleMapProvider>
  );
}
