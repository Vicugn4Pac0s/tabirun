import { useRoutePoints } from "../../route-points/hooks/useRoutePoints";
import { useRoutePointsStore } from "../../route-points/stores/routePointsStore";

export const useRoutePointAction = (
  currentPoint: google.maps.LatLngLiteral
) => {
  const addRoutePoint = useRoutePointsStore((s) => s.addRoutePoint);
  const removeRoutePointByLatLng = useRoutePointsStore(
    (s) => s.removeRoutePointByLatLng
  );

  const { isInRoute } = useRoutePoints(currentPoint);

  const type: "add" | "delete" = isInRoute ? "delete" : "add";

  const toggle = () => {
    if (isInRoute) {
      removeRoutePointByLatLng(currentPoint);
    } else {
      addRoutePoint(currentPoint);
    }
  };

  return {
    type,
    toggle,
  };
};