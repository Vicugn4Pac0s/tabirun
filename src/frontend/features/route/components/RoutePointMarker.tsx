import { useCallback } from "react";
import AdvancedMarker from "~/frontend/features/googlemap/components/AdvancedMarker";
import type { RouteMapMarker } from "../types";

type RoutePointMarkerProps = Omit<RouteMapMarker, "id"> & {
  map: google.maps.Map | null;
};

function createRouteMarkerContent() {
  const size = 28;
  const content = document.createElement("div");
  content.style.borderRadius = "50%";
  content.style.color = "white";
  content.style.fontSize = "14px";
  content.style.fontWeight = "bold";
  content.style.textAlign = "center";
  content.style.lineHeight = `${size}px`;
  content.style.width = `${size}px`;
  content.style.position = "relative";
  content.style.top = `${size / 2}px`;
  return content;
}

/** 指定された地図に、ラベルと読み上げ用の名前を持つ地点マーカーを配置する。 */
export function RoutePointMarker({
  map,
  position,
  label,
  title,
  color = "rgba(0, 0, 0, 0.6)",
  onClick,
}: RoutePointMarkerProps) {
  const updateContent = useCallback(
    (content: HTMLElement) => {
      content.textContent = label;
      content.style.backgroundColor = color;
    },
    [label, color],
  );

  return (
    <AdvancedMarker
      map={map}
      createContent={createRouteMarkerContent}
      updateContent={updateContent}
      onClick={onClick}
      options={{ position, title }}
    />
  );
}
export default RoutePointMarker;
