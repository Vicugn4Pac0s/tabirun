"use client";

import { useCallback } from "react";
import { useGoogleMap } from "../providers/GoogleMapProvider";

const ROUTE_FIT_BOUNDS_PADDING_PX = 48;

export function useFocusMapOnRoute() {
  const { map } = useGoogleMap();

  const focusMapOnRoute = useCallback(
    (routePoints: google.maps.LatLngLiteral[]) => {
      if (!map || routePoints.length === 0) {
        return false;
      }

      const bounds = new window.google.maps.LatLngBounds();
      routePoints.forEach((point) => {
        bounds.extend(point);
      });

      map.fitBounds(bounds, ROUTE_FIT_BOUNDS_PADDING_PX);
      return true;
    },
    [map],
  );

  return {
    focusMapOnRoute,
  };
}
