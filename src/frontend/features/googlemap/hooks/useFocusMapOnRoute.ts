"use client";

import { useCallback } from "react";
import { useGoogleMap } from "../providers/GoogleMapProvider";

const ROUTE_FIT_BOUNDS_PADDING_PX = 48;

/**
 * 全地点が収まるよう地図を移動する関数を返す。GoogleMapProvider内で使う。
 * 返した関数は地図未初期化・地点なしならfalse、表示範囲を更新したらtrueを返す。
 */
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
