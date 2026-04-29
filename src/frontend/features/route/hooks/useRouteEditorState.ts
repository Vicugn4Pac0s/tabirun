import { useRoutePointsStore } from "../../route-points/stores/routePointsStore";
import { useSelectedRouteStore } from "../stores/selectedRouteStore";

function areRoutePointsEqual(
  a: google.maps.LatLngLiteral[],
  b: google.maps.LatLngLiteral[],
) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((point, index) => {
    const target = b[index];
    return target && point.lat === target.lat && point.lng === target.lng;
  });
}

export function useRouteEditorState() {
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const selectedRoute = useSelectedRouteStore((state) => state.selectedRoute);
  const mode = useSelectedRouteStore((state) => state.mode);
  const draftTitle = useSelectedRouteStore((state) => state.draftTitle);

  const isDirty = selectedRoute
    ? (selectedRoute.title ?? "") !== draftTitle ||
      !areRoutePointsEqual(selectedRoute.points, routePoints)
    : false;

  return {
    selectedRoute,
    mode,
    draftTitle,
    isDirty,
    isViewingSavedRoute: Boolean(selectedRoute),
    canEditRoutePoints: !selectedRoute || mode === "edit",
  };
}
