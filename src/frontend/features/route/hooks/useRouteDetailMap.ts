import { useEffect, useState } from "react";
import useGooglemapDirectionQuery from "~/frontend/hooks/googlemap/useGooglemapDirectionQuery";

export function useRouteDetailMap(points: google.maps.LatLngLiteral[]) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { directions, isLoading, error } = useGooglemapDirectionQuery(points, {
    enabled: true,
  });
  const path = directions?.path.length ? directions.path : null;
  const boundsPoints = path ?? points;

  useEffect(() => {
    if (!map || boundsPoints.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    boundsPoints.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, 48);
  }, [map, boundsPoints]);

  return { map, setMap, path, isLoading, error };
}
