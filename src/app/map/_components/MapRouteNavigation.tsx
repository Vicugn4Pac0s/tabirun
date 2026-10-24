"use client";

import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import { useRoutePointAction } from "~/frontend/features/route-points-navigation/hooks/useRoutePointAction";
import { RouteNavigation } from "~/frontend/features/route-points-navigation/components/RouteNavigation";

interface MapRouteNavigationProps {
  currentPoint: google.maps.LatLngLiteral;
  canEdit?: boolean;
}

const MapRouteNavigation = ({
  currentPoint,
  canEdit = true,
}: MapRouteNavigationProps) => {
  const moveStreetView = useMoveStreetView();
  const points = useRoutePointsStore((state) => state.routePoints);
  const { toggle } = useRoutePointAction(currentPoint);
  return (
    <RouteNavigation
      points={points}
      currentPoint={currentPoint}
      onMove={(point) => {
        void moveStreetView(point);
      }}
      onToggle={toggle}
      canEdit={canEdit}
    />
  );
};
export default MapRouteNavigation;
