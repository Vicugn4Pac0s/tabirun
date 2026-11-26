"use client";

import { useId, useRef, useState } from "react";
import { getRouteMenuLabel } from "../lib/getRouteMenuLabel";
import { RunMetricsPanel } from "~/frontend/features/run-metrics/components/RunMetricsPanel";
import { useRunEstimateInputs } from "~/frontend/features/run-metrics/hooks/useRunEstimateInputs";
import { useRouteEditDirection } from "../hooks/useRouteEditDirection";

import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { useRouteEditMap } from "../hooks/useRouteEditMap";
import type { RouterOutputs } from "~/trpc/react";
import { RouteScreenLayout } from "../components/RouteScreenLayout";
import { Button } from "~/frontend/components/ui/button";
import { RouteMap } from "../components/RouteMap";

import RouteMenuButton from "../components/RouteMenuButton";
import { RouteSidebar } from "../components/RouteSidebar";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarTriggerRef = useRef<HTMLButtonElement>(null);
  const sidebarId = useId();
  return (
    <RouteScreenLayout
      confirmNavigation={() => !isUpdating && confirmDiscard()}
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
      <h1 className="sr-only">ルートを編集</h1>
      <RouteMap
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
          </>
        }
        warning={warningMessage}
        editing={{
          points,
          disabled: draft.isSubmitting || isUpdating,
          onTogglePoint: togglePoint,
        }}
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
