import { useCallback } from "react";
import AdvancedMarker from "./AdvancedMarker";

const DOT_SIZE = 20;
const BORDER = 2;

interface StreetViewPointMarkerProps {
  map: google.maps.Map | null;
  latLng: google.maps.LatLngLiteral | null;
  pov: google.maps.StreetViewPov | null;
}

function createStreetViewMarkerContent() {
  const root = document.createElement("div");
  root.style.position = "relative";
  root.style.width = `${DOT_SIZE}px`;
  root.style.height = `${DOT_SIZE}px`;
  root.style.top = `${DOT_SIZE / 2}px`;

  const dot = document.createElement("div");
  dot.style.position = "absolute";
  dot.style.left = "0";
  dot.style.top = "0";
  dot.style.width = `${DOT_SIZE}px`;
  dot.style.height = `${DOT_SIZE}px`;
  dot.style.boxSizing = "border-box";
  dot.style.backgroundColor = "hsl(var(--primary))";
  dot.style.border = `${BORDER}px solid white`;
  dot.style.boxShadow = "0 0 5px hsl(var(--primary))";
  dot.style.borderRadius = "50%";

  const arrow = document.createElement("div");
  arrow.style.position = "absolute";
  arrow.style.width = "0";
  arrow.style.height = "0";
  arrow.style.borderLeft = "6px solid transparent";
  arrow.style.borderRight = "6px solid transparent";
  arrow.style.borderBottom = "10px solid hsl(var(--primary))";
  arrow.style.pointerEvents = "none";

  root.appendChild(dot);
  root.appendChild(arrow);
  return root;
}

/**
 * Street Viewの位置と方角を点と矢印で地図上に表示する。
 * 地図・位置・視点が揃うまでは何も表示しない。
 */
export function StreetViewPointMarker({
  map,
  latLng,
  pov,
}: StreetViewPointMarkerProps) {
  const heading = pov?.heading;
  const updateContent = useCallback(
    (content: HTMLElement) => {
      const arrow = content.lastElementChild;
      if (!(arrow instanceof HTMLElement) || heading === undefined) return;

      const center = DOT_SIZE / 2;
      const radius = 16;
      const radians = (heading * Math.PI) / 180;

      // 北0度を上に：x=sin, y=-cos
      arrow.style.left = `${center + radius * Math.sin(radians)}px`;
      arrow.style.top = `${center - radius * Math.cos(radians)}px`;
      arrow.style.transform = `translate(-50%, -50%) rotate(${heading}deg)`;
    },
    [heading],
  );

  if (!map || !latLng || !pov) return null;

  return (
    <AdvancedMarker
      map={map}
      createContent={createStreetViewMarkerContent}
      updateContent={updateContent}
      options={{ position: latLng }}
    />
  );
}
export default StreetViewPointMarker;
