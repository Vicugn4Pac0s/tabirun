import { useMemo } from "react";
import { useRoutePointsStore } from "../stores/routePointsStore";

type LatLng = google.maps.LatLngLiteral;

type RoutePointsState = {
  activeIndex: number | null;
  isInRoute: boolean;
  isFirst: boolean;
  isLast: boolean;
  canPrev: boolean;
  canNext: boolean;
  canFirst: boolean;
  canLast: boolean;
  prevIndex: number | null;
  nextIndex: number | null;
  firstIndex: number | null;
  lastIndex: number | null;
  prevRoutePoint: LatLng | null;
  nextRoutePoint: LatLng | null;
  firstRoutePoint: LatLng | null;
  lastRoutePoint: LatLng | null;
};

export function useRoutePoints(currentPoint: google.maps.LatLngLiteral) {
  const routePoints = useRoutePointsStore((state) => state.routePoints);

  return useMemo<RoutePointsState>(() => {
    if (routePoints.length === 0) {
      return {
        activeIndex: null,
        isInRoute: false,
        isFirst: false,
        isLast: false,
        canPrev: false,
        canNext: false,
        canFirst: false,
        canLast: false,
        prevIndex: null,
        nextIndex: null,
        firstIndex: null,
        lastIndex: null,
        prevRoutePoint: null,
        nextRoutePoint: null,
        firstRoutePoint: null,
        lastRoutePoint: null,
      };
    }

    const index = routePoints.findIndex((point: LatLng) => 
      point.lat === currentPoint.lat && point.lng === currentPoint.lng
    );

    const isInRoute = index !== -1;
    const activeIndex = index;

    const isFirst = isInRoute && activeIndex === 0;
    const isLast = isInRoute && activeIndex === routePoints.length - 1;

    const canPrev = isInRoute && !isFirst;
    const canNext = isInRoute && !isLast;

    const canFirst = isInRoute && !isFirst;
    const canLast = isInRoute && !isLast;

    const prevIndex = canPrev ? activeIndex - 1 : null;
    const nextIndex = canNext ? activeIndex + 1 : null;

    const firstIndex = isInRoute ? 0 : null;
    const lastIndex = isInRoute ? routePoints.length - 1 : null;

    const prevRoutePoint = prevIndex !== null ? routePoints[prevIndex] ?? null : null;
    const nextRoutePoint = nextIndex !== null ? routePoints[nextIndex] ?? null : null;
    const firstRoutePoint =
      firstIndex !== null ? routePoints[firstIndex] ?? null : null;
    const lastRoutePoint = lastIndex !== null ? routePoints[lastIndex] ?? null : null;
    
    return {
      activeIndex,
      isInRoute,
      isFirst,
      isLast,
      canPrev,
      canNext,
      canFirst,
      canLast,
      prevIndex,
      nextIndex,
      firstIndex,
      lastIndex,
      prevRoutePoint,
      nextRoutePoint,
      firstRoutePoint,
      lastRoutePoint,
    };
  }, [routePoints, currentPoint]);
}
