"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { GuardedLink } from "~/frontend/providers/GuardedLink";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "~/frontend/components/ui/dropdown-menu";
import { getRouteMenuLabel } from "../lib/getRouteMenuLabel";
import { RunMetricsPanel } from "~/frontend/features/run-metrics/components/RunMetricsPanel";
import { useRunEstimateInputs } from "~/frontend/features/run-metrics/hooks/useRunEstimateInputs";
import { useRoutePolylinePath } from "~/frontend/features/googlemap/hooks/useRoutePolylinePath";

import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { getRouteCalculationWarningMessage } from "../lib/getRouteCalculationWarningMessage";
import { useRouteCreateMap } from "../hooks/useRouteCreateMap";
import { RouteMapLayout } from "../components/RouteMapLayout";
import { Button } from "~/frontend/components/ui/button";
import { RouteMap } from "../components/RouteMap";

import RouteMenuButton from "../components/RouteMenuButton";

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
  const [panelOpen, setPanelOpen] = useState(false);
  return (
    <RouteMapLayout
      panelOpen={panelOpen}
      onPanelOpenChange={setPanelOpen}
      confirmNavigation={() => !isCreating && confirmDiscard()}
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
              disabled={!draft.canSave || draft.isSubmitting || isCreating}
            >
              {draft.isSubmitting || isCreating
                ? "保存中..."
                : "詳細入力へ進む"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="ルート操作を開く"
                  disabled={draft.isSubmitting || isCreating}
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <GuardedLink href={"/"}>ホームへ戻る</GuardedLink>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!draft.isDirty || draft.isSubmitting || isCreating}
                  onSelect={draft.reset}
                >
                  リセット
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
        warning={warningMessage}
        editing={{
          points,
          disabled: draft.isSubmitting || isCreating,
          onTogglePoint: togglePoint,
        }}
      />
    </RouteMapLayout>
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
