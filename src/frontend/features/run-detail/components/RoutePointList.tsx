import RoutePointListItem from "~/frontend/features/route-points/components/RoutePointListItem";

interface RoutePointListProps {
  routePoints: google.maps.LatLngLiteral[];
  onRoutePointClick?: (point: google.maps.LatLngLiteral, index: number) => void;
}

function RoutePointList({
  routePoints,
  onRoutePointClick,
}: RoutePointListProps) {
  if (routePoints.length === 0) {
    return null;
  }

  return (
    <ul>
      {routePoints.map((point, index) => (
        <li key={index} className="mb-2">
          <RoutePointListItem
            index={index}
            onClick={() => {
              onRoutePointClick?.(point, index);
            }}
          />
        </li>
      ))}
    </ul>
  );
}

export default RoutePointList;
