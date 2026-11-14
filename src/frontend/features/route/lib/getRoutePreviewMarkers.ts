import type { RouteMapMarker } from "../types";

/**
 * 始点・終点のプレビューマーカーを返す。どちらかがなければ空配列にする。
 * 始点と終点が同じ座標ならS/Gの1個にまとめる。
 */
export function getRoutePreviewMarkers(
  start: google.maps.LatLngLiteral | undefined,
  goal: google.maps.LatLngLiteral | undefined,
): RouteMapMarker[] {
  if (!start || !goal) return [];

  const isRoundTrip = start.lat === goal.lat && start.lng === goal.lng;
  if (isRoundTrip) {
    return [
      {
        id: "start",
        position: start,
        label: "S/G",
        title: "スタート／ゴール",
        color: "#1d4ed8",
      },
    ];
  }

  return [
    {
      id: "start",
      position: start,
      label: "S",
      title: "スタート",
      color: "#15803d",
    },
    {
      id: "goal",
      position: goal,
      label: "G",
      title: "ゴール",
      color: "#b91c1c",
    },
  ];
}
