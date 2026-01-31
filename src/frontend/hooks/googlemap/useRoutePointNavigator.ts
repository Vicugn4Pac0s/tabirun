import { useMemo } from "react";
import { useRoutePointsStore } from "~/frontend/stores/googlemap/routePointsStore";
import { useStreetViewPanoramaStore } from "~/frontend/stores/googlemap/streetViewPanoramaStore";

type LatLng = google.maps.LatLngLiteral;

export function useRoutePointNavigator() {
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const streetViewPanoramaCenter = useStreetViewPanoramaStore((state) => state.streetViewPanoramaCenter);

  return useMemo(() => {
    if (!streetViewPanoramaCenter || routePoints.length === 0) {
      return {
        activeIndex: null,
        isInRoute: false,
        isFirst: false,
        isLast: false,
        canPrev: false,
        canNext: false,
        canFirst: false,
        canLast: false,
        prevIndex: null as number | null,
        nextIndex: null as number | null,
        firstIndex: null as number | null,
        lastIndex: null as number | null,
        prevRoutePoint: null as LatLng | null,
        nextRoutePoint: null as LatLng | null,
        firstRoutePoint: null as LatLng | null,
        lastRoutePoint: null as LatLng | null,
      };
    }

    const index = routePoints.findIndex((point: LatLng) => 
      point.lat === streetViewPanoramaCenter.lat && point.lng === streetViewPanoramaCenter.lng
    );

    const isInRoute = index !== -1;
    const activeIndex = index;

    const isFirst = isInRoute && activeIndex === 0;
    const isLast = isInRoute && activeIndex === routePoints.length - 1;

    const canPrev = isInRoute && !isFirst;
    const canNext = isInRoute && !isLast;

    const canFirst = isInRoute && !isFirst;
    const canLast = isInRoute && !isLast;

    const prevIndex = canPrev ? (activeIndex! - 1) : null;
    const nextIndex = canNext ? (activeIndex! + 1) : null;

    const firstIndex = isInRoute ? 0 : null;
    const lastIndex = isInRoute ? routePoints.length - 1 : null;

    const prevRoutePoint = prevIndex !== null ? routePoints[prevIndex] : null;
    const nextRoutePoint = nextIndex !== null ? routePoints[nextIndex] : null;
    const firstRoutePoint = firstIndex !== null ? routePoints[firstIndex] : null;
    const lastRoutePoint = lastIndex !== null ? routePoints[lastIndex] : null;
    
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
      lastRoutePoint
    };
  }, [routePoints, streetViewPanoramaCenter]);
}