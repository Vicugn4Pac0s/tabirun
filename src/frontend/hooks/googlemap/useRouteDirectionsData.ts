import { useMemo } from "react";
import { useRouteDirectionsStore } from "~/frontend/stores/googlemap/routeDirectionsStore";

type DirectionsMeta = {
  distanceMeters: number;
  durationSeconds: number;
  distanceKm: number;
  durationMinutes: number;
  distanceText: string;
  durationText: string;
};

function buildMeta(result: google.maps.DirectionsResult | null): DirectionsMeta | null {
  const route = result?.routes?.[0];
  const legs = route?.legs ?? [];
  if (!route || legs.length === 0) return null;

  let distanceMeters = 0;
  let durationSeconds = 0;

  for (const leg of legs) {
    distanceMeters += leg.distance?.value ?? 0;
    durationSeconds += leg.duration?.value ?? 0;
  }

  const distanceKm = distanceMeters / 1000;
  const durationMinutes = durationSeconds / 60;

  const distanceText = `${distanceKm.toFixed(2)} km`;

  const h = Math.floor(durationSeconds / 3600);
  const m = Math.floor((durationSeconds % 3600) / 60);
  const s = durationSeconds % 60;
  const durationText = h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;

  return {
    distanceMeters,
    durationSeconds,
    distanceKm,
    durationMinutes,
    distanceText,
    durationText,
  };
}

export function useRouteDirectionsData() {
  const routeDirections = useRouteDirectionsStore((state) => state.routeDirections);
  
  const meta = useMemo(() => buildMeta(routeDirections), [routeDirections]);

  return {
    routeDirections,
    meta,
  };
}