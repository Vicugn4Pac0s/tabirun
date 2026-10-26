import { metersToKilometers } from "~/frontend/lib/running";

export function getRouteMenuLabel(
  distanceMeters: number | null | undefined,
  isLoading: boolean,
): string {
  if (isLoading) return "MEASURING";
  const distanceKm = distanceMeters ? metersToKilometers(distanceMeters) : 0;
  return distanceKm > 0 ? `${distanceKm} km` : "MENU";
}
