"use client";

import { useRef, useState } from "react";
import { RouteDraftDialog } from "../components/RouteDraftDialog";
import { ActionsDropdownMenu } from "~/frontend/components/app-ui/ActionsDropdownMenu";
import { GuardedLink } from "~/frontend/providers/GuardedLink";
import { DropdownMenuItem } from "~/frontend/components/ui/dropdown-menu";
import { getRouteMenuLabel } from "../lib/getRouteMenuLabel";
import { RunMetricsPanel } from "~/frontend/features/run-metrics/components/RunMetricsPanel";
import { useRunEstimateInputs } from "~/frontend/features/run-metrics/hooks/useRunEstimateInputs";
import { useRoutePolylinePath } from "~/frontend/features/googlemap/hooks/useRoutePolylinePath";

import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { getRouteCalculationWarningMessage } from "../lib/getRouteCalculationWarningMessage";
import { useRouteCreateMapForm } from "../hooks/useRouteCreateMapForm";
import { RouteMapLayout } from "../components/RouteMapLayout";
import { Button } from "~/frontend/components/ui/button";
import { RouteMap } from "../components/RouteMap";

import RouteMenuButton from "../components/RouteMenuButton";

type RouteCreateMapProps = { defaultCenter: google.maps.LatLngLiteral };

function RouteCreateMapContent({ defaultCenter }: RouteCreateMapProps) {
  const { pointsForm, isSaving, save } = useRouteCreateMapForm();
  const { points, togglePoint, confirmDiscard } = pointsForm;
  const { polylinePath, directions, isLoading, error } = useRoutePolylinePath(
    points,
    { canUseDirections: true },
  );
  const warningMessage = getRouteCalculationWarningMessage(error, "editable");
  const { pace, setPace, weightKg } = useRunEstimateInputs();
  const [panelOpen, setPanelOpen] = useState(false);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const actionsTriggerRef = useRef<HTMLButtonElement>(null);
  return (
    <RouteMapLayout
      panelOpen={panelOpen}
      onPanelOpenChange={setPanelOpen}
      confirmNavigation={() => !isSaving && confirmDiscard()}
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
      <RouteDraftDialog
        open={draftsOpen}
        onOpenChange={setDraftsOpen}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          actionsTriggerRef.current?.focus();
        }}
      />
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
              disabled={!pointsForm.canSave || isSaving}
            >
              {isSaving ? "保存中..." : "詳細入力へ進む"}
            </Button>
            {/* 下書きダイアログへフォーカスを渡せるよう、メニュー内に閉じ込めない。 */}
            <ActionsDropdownMenu
              aria-label="ルート操作を開く"
              disabled={isSaving}
              modal={false}
              ref={actionsTriggerRef}
              onCloseAutoFocus={(event) => {
                if (draftsOpen) event.preventDefault();
              }}
            >
              <DropdownMenuItem onSelect={() => setDraftsOpen(true)}>
                下書きから再開
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <GuardedLink href={"/"}>ホームへ戻る</GuardedLink>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!pointsForm.isDirty || isSaving}
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
          disabled: isSaving,
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
