"use client";

import { useState } from "react";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import { RouteNavigation } from "~/frontend/features/route-points/components/RouteNavigation";
import RouteMapView from "./RouteMapView";

type RouteEditorMapProps = {
  initialCenter: google.maps.LatLngLiteral;
  points: google.maps.LatLngLiteral[];
  polylinePath: google.maps.LatLngLiteral[] | null;
  isLoading: boolean;
  disabled: boolean;
  fitToRoute?: boolean;
  onTogglePoint: (point: google.maps.LatLngLiteral) => void;
};

export function RouteEditorMap({
  initialCenter,
  points,
  polylinePath,
  isLoading,
  disabled,
  fitToRoute = false,
  onTogglePoint,
}: RouteEditorMapProps) {
  const [selectedPoint, setSelectedPoint] =
    useState<google.maps.LatLngLiteral | null>(null);
  const moveStreetView = useMoveStreetView();

  return (
    <div className="relative flex min-w-0 flex-1">
      <RouteMapView
        showStreetView
        initialCenter={initialCenter}
        path={polylinePath}
        markers={points.map((point, index) => ({
          id: String(index),
          position: point,
          label: String(index + 1),
          title: `地点 ${index + 1}`,
        }))}
        isLoading={isLoading}
        fitToRoute={fitToRoute}
        onSelectedPointChange={setSelectedPoint}
      />
      {selectedPoint && (
        <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 min-[1201px]:peer-data-[street-view=visible]:left-1/4">
          <RouteNavigation
            points={points}
            currentPoint={selectedPoint}
            onMove={(target) => {
              void moveStreetView(target).catch(() => undefined);
            }}
            onToggle={() => onTogglePoint(selectedPoint)}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
