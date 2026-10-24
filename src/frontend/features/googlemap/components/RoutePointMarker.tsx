import { useRef } from "react";
import AdvancedMarker from "./AdvancedMarker";
import type { RouteMapMarker } from "../types";

type RoutePointMarkerProps = Omit<RouteMapMarker, "id"> & {
  map: google.maps.Map | null;
};

export function RoutePointMarker({
  map,
  position,
  label,
  title,
  color = "rgba(0, 0, 0, 0.6)",
  onClick,
}: RoutePointMarkerProps) {
  const markerRef = useRef(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const SIZE = 28;

  if (!contentRef.current && typeof document !== "undefined") {
    const content = document.createElement("div");
    content.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
    content.style.borderRadius = "50%";
    content.style.color = "white";
    content.style.fontSize = "14px";
    content.style.fontWeight = "bold";
    content.style.textAlign = "center";
    content.style.lineHeight = `${SIZE}px`;
    content.style.width = `${SIZE}px`;
    content.style.position = "relative";
    content.style.top = `${SIZE / 2}px`;
    contentRef.current = content;
  }

  if (!contentRef.current) {
    return null;
  }

  contentRef.current.textContent = label;
  contentRef.current.style.backgroundColor = color;

  return (
    <AdvancedMarker
      map={map}
      markerRef={markerRef}
      content={contentRef.current}
      onClick={() => {
        onClick?.();
      }}
      options={{
        position,
        title,
      }}
    />
  );
}
export default RoutePointMarker;
