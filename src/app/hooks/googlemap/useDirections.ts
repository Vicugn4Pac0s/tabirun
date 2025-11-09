import { useCallback } from "react";
import { useMapStore } from "~/app/stores/googlemap/mapStore";

export function useDirections() {
  const directionsService = useMapStore((state) => state.directionsService);

  const getDirections = useCallback(
    async (routePoints: google.maps.LatLngLiteral[]) => {
      if (!directionsService || routePoints.length < 2) return null;

      const origin = routePoints[0];
      const destination = routePoints[routePoints.length - 1];
      const waypoints = routePoints.slice(1, -1).map((point) => ({ location: point }));

      if (origin === undefined || destination === undefined) return null;

      const request: google.maps.DirectionsRequest = {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.WALKING,
      };

      return new Promise<google.maps.DirectionsResult | null>((resolve) => {
        directionsService.route(request, (result, status) => {
          if (status !== google.maps.DirectionsStatus.OK || !result) {
            resolve(null);
          } else {
            resolve(result);
          }
        });
      });
    },
    [directionsService]
  );

  return { getDirections };
}