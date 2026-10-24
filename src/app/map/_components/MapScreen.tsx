"use client";
import { useState } from "react";
import { useRouteEditorState } from "~/frontend/features/route/hooks/useRouteEditorState";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import useRoutePolylinePath from "~/frontend/hooks/googlemap/useRoutePolylinePath";
import { useAuthPermission } from "~/frontend/features/auth/components/hooks/useAuthPermission";
import RoutePointsNavigation from "~/frontend/features/route-points-navigation/components/RouteNavigation";
import RouteMapView from "~/frontend/features/googlemap/components/RouteMapView";

type MapScreenProps = { defaultCenter: google.maps.LatLngLiteral };

function MapScreen({ defaultCenter }: MapScreenProps) {
  const { permissions } = useAuthPermission();
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const { canEditRoutePoints, selectedRoute } = useRouteEditorState();
  const [initialRoute] = useState(selectedRoute);
  const { polylinePath, isLoading } = useRoutePolylinePath(routePoints, {
    canUseDirections: permissions.canUseDirections,
  });
  return (
    <RouteMapView
      initialCenter={initialRoute?.points[0] ?? defaultCenter}
      path={polylinePath}
      markers={routePoints.map((point, index) => ({
        id: String(index),
        position: point,
        label: String(index + 1),
        title: `地点 ${index + 1}`,
      }))}
      isLoading={isLoading}
      fitToRoute={Boolean(initialRoute)}
      renderNavigation={(point) => (
        <RoutePointsNavigation
          currentPoint={point}
          canEdit={canEditRoutePoints}
        />
      )}
    />
  );
}
export default MapScreen;
