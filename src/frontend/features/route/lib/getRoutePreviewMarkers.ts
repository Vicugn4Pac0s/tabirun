import type { RouteMapMarker } from "~/frontend/features/googlemap/types";

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
