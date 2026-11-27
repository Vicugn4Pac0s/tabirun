"use client";

import { useState } from "react";
import { ActionsDropdownMenu } from "~/frontend/components/app-ui/ActionsDropdownMenu";
import { GuardedLink } from "~/frontend/providers/GuardedLink";
import { DropdownMenuItem } from "~/frontend/components/ui/dropdown-menu";
import { getRouteMenuLabel } from "../lib/getRouteMenuLabel";
import { RunMetricsPanel } from "~/frontend/features/run-metrics/components/RunMetricsPanel";
import { useRunEstimateInputs } from "~/frontend/features/run-metrics/hooks/useRunEstimateInputs";
import { useRouteDirection } from "../hooks/useRouteDirection";

import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { useRouteEditMapForm } from "../hooks/useRouteEditMapForm";
import type { RouterOutputs } from "~/trpc/react";
import { RouteMapLayout } from "../components/RouteMapLayout";
import { Button } from "~/frontend/components/ui/button";
import { RouteMap } from "../components/RouteMap";

import RouteMenuButton from "../components/RouteMenuButton";

type RouteEditMapProps = {
  route: Pick<
    RouterOutputs["route"]["getById"],
    "id" | "status" | "points" | "direction" | "directionErrorCode"
  >;
};

function RouteEditMapContent({ route }: RouteEditMapProps) {
  const { pointsForm, isUpdating, save } = useRouteEditMapForm(route);
  const { points, togglePoint, confirmDiscard } = pointsForm;
  const { polylinePath, directions, isLoading, warningMessage } =
    useRouteDirection(route, points);
  const { pace, setPace, weightKg } = useRunEstimateInputs();
  const [panelOpen, setPanelOpen] = useState(false);
  return (
    <RouteMapLayout
      panelOpen={panelOpen}
      onPanelOpenChange={setPanelOpen}
      confirmNavigation={() => !isUpdating && confirmDiscard()}
      panelContent={
        <RunMetricsPanel
          distanceMeters={directions?.distanceMeters}
          isLoading={isLoading}
          pace={pace}
          onPaceChange={setPace}
          weightKg={weightKg}
        />
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
            label={getRouteMenuLabel(directions?.distanceMeters, isLoading)}
            aria-label={`ルート情報を${panelOpen ? "閉じる" : "開く"}`}
            aria-expanded={panelOpen}
            onClick={() => setPanelOpen((value) => !value)}
          />
        }
        topRight={
          <>
            <Button
              type="button"
              onClick={() => {
                void save();
              }}
              disabled={
                !pointsForm.canSave || pointsForm.isSubmitting || isUpdating
              }
            >
              {pointsForm.isSubmitting || isUpdating ? "更新中..." : "更新する"}
            </Button>
            <ActionsDropdownMenu
              aria-label="ルート操作を開く"
              disabled={pointsForm.isSubmitting || isUpdating}
            >
              <DropdownMenuItem asChild>
                <GuardedLink
                  href={`/routes/${route.id}${route.status === "draft" ? "/details" : ""}`}
                >
                  ルート詳細に戻る
                </GuardedLink>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={
                  !pointsForm.isDirty || pointsForm.isSubmitting || isUpdating
                }
                onSelect={pointsForm.reset}
              >
                リセット
              </DropdownMenuItem>
            </ActionsDropdownMenu>
          </>
        }
        warning={warningMessage}
        editing={{
          points,
          disabled: pointsForm.isSubmitting || isUpdating,
          onTogglePoint: togglePoint,
        }}
      />
    </RouteMapLayout>
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
