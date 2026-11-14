import { metersToKilometers } from "~/frontend/lib/running";

/**
 * 距離の有無に応じたメニューラベルを返す。計算中は距離よりMEASURINGを優先する。
 */
export function getRouteMenuLabel(
  distanceMeters: number | null | undefined,
  isLoading: boolean,
): string {
  if (isLoading) return "MEASURING";
  const distanceKm = distanceMeters ? metersToKilometers(distanceMeters) : 0;
  return distanceKm > 0 ? `${distanceKm} km` : "MENU";
}
