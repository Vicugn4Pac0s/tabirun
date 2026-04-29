import CreateRouteDialog from "./CreateRouteDialog";

interface RouteCreateActionProps {
  isAuthenticated: boolean;
  routePoints: google.maps.LatLngLiteral[];
}

function RouteCreateAction({
  isAuthenticated,
  routePoints,
}: RouteCreateActionProps) {
  if (!isAuthenticated || routePoints.length < 2) {
    return null;
  }

  return <CreateRouteDialog routePoints={routePoints} />;
}

export default RouteCreateAction;
