import CreateRouteDialog from "./CreateRouteDialog";

interface RouteCreateActionProps {
  isAuthenticated: boolean;
  routePoints: google.maps.LatLngLiteral[];
  kilometers: number;
}

function RouteCreateAction({
  isAuthenticated,
  routePoints,
  kilometers,
}: RouteCreateActionProps) {
  if (!isAuthenticated || routePoints.length < 2) {
    return null;
  }

  return <CreateRouteDialog routePoints={routePoints} kilometers={kilometers} />;
}

export default RouteCreateAction;
