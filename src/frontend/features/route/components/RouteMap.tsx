"use client";

import { useState, type ReactNode } from "react";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import { RouteNavigation } from "~/frontend/features/route-points/components/RouteNavigation";
import RouteMapView from "./RouteMapView";
import { ROUTE_POINTS_MAX } from "~/shared/schemas";
import { WarningBanner } from "~/frontend/components/app-ui/WarningBanner";
import type { RouteMapMarker } from "../types";

type RouteMapProps = {
  initialCenter: google.maps.LatLngLiteral;
  path: google.maps.LatLngLiteral[] | null;
  markers: RouteMapMarker[];
  isLoading?: boolean;
  fitToRoute?: boolean;
  topLeft?: ReactNode;
  topRight?: ReactNode;
  warning?: string | null;
  editing?: {
    points: google.maps.LatLngLiteral[];
    disabled: boolean;
    onTogglePoint: (point: google.maps.LatLngLiteral) => void;
  };
};

/**
 * 地図とStreet Viewをつなぎ、地図上部のUI・警告と、指定時だけ地点編集の操作を配置する。
 * markersは描画専用、editing.pointsは地点操作専用。GoogleMapProvider内で使う。
 */
export function RouteMap({
  initialCenter,
  path,
  markers,
  isLoading = false,
  fitToRoute = false,
  topLeft,
  topRight,
  warning,
  editing,
}: RouteMapProps) {
  const [selectedPoint, setSelectedPoint] =
    useState<google.maps.LatLngLiteral | null>(null);
  const moveStreetView = useMoveStreetView();

  return (
    <RouteMapView
      showStreetView
      initialCenter={initialCenter}
      path={path}
      markers={markers}
      isLoading={isLoading}
      fitToRoute={fitToRoute}
      onSelectedPointChange={setSelectedPoint}
    >
      <div
        className="pointer-events-none absolute inset-x-3 top-3 z-20 space-y-3 md:inset-x-6 md:top-6"
        onKeyDown={(event) => {
          // 上部UIのEnter操作を地点追加・削除へ流さない。
          if (event.key === "Enter") event.stopPropagation();
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col items-start gap-2">
            {topLeft && <div className="pointer-events-auto">{topLeft}</div>}
            {editing && (
              <div
                role="status"
                aria-label="ルートの地点数"
                className="px-1 text-xs leading-4 text-foreground"
              >
                <p>
                  地点{" "}
                  <strong className="font-inter font-bold tabular-nums text-primary">
                    {editing.points.length}
                  </strong>{" "}
                  / {ROUTE_POINTS_MAX}
                </p>
                {editing.points.length >= ROUTE_POINTS_MAX && (
                  <p className="mt-2">1ルート{ROUTE_POINTS_MAX}地点までです</p>
                )}
              </div>
            )}
          </div>
          {topRight && (
            <div className="pointer-events-auto ml-auto flex flex-wrap justify-end gap-2">
              {topRight}
            </div>
          )}
        </div>
        {warning && (
          <div className="pointer-events-auto">
            <WarningBanner>{warning}</WarningBanner>
          </div>
        )}
      </div>
      {editing && selectedPoint && (
        <div className="absolute inset-x-3 bottom-4 z-10 flex justify-center md:inset-x-6 md:bottom-6">
          <RouteNavigation
            points={editing.points}
            currentPoint={selectedPoint}
            onMove={(target) => {
              void moveStreetView(target).catch(() => undefined);
            }}
            onToggle={() => editing.onTogglePoint(selectedPoint)}
            disabled={editing.disabled}
          />
        </div>
      )}
    </RouteMapView>
  );
}
