import { useEffect, useRef } from "react";
import AdvancedMarker from "~/components/atoms/googlemap/AdvancedMarker";

interface StreetViewPointMarkerProps {
  map: google.maps.Map | null;
  latLng: google.maps.LatLngLiteral | null;
  pov: google.maps.StreetViewPov | null;
}

export function StreetViewPointMarker({map, latLng, pov}: StreetViewPointMarkerProps) {

  const markerRef = useRef(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const arrowRef = useRef<HTMLDivElement | null>(null);
  
  const DOT_SIZE = 20;
  const BORDER = 2;

  if (!contentRef.current && typeof document !== "undefined") {
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
    dot.style.backgroundColor = "#3B82F6";
    dot.style.border = `${BORDER}px solid white`;
    dot.style.boxShadow = "0 0 5px #3B82F6";
    dot.style.borderRadius = "50%";

    const arrow = document.createElement("div");
    arrow.style.position = "absolute";
    arrow.style.width = "0";
    arrow.style.height = "0";
    arrow.style.borderLeft = "6px solid transparent";
    arrow.style.borderRight = "6px solid transparent";
    arrow.style.borderBottom = "10px solid #3B82F6";
    arrow.style.filter = "drop-shadow(0 0 3px rgba(59,130,246,.8))";
    arrow.style.pointerEvents = "none";

    root.appendChild(dot);
    root.appendChild(arrow);

    contentRef.current = root;
    arrowRef.current = arrow;
  }

  useEffect(() => {
    if (!contentRef.current || !arrowRef.current || !pov) return;

    const cx = DOT_SIZE / 2;
    const cy = DOT_SIZE / 2;

    const r = 16; // 外周付近なら 10〜14あたりで調整
    const rad = (pov.heading * Math.PI) / 180;

    // 北0度を上に：x=sin, y=-cos
    const x = r * Math.sin(rad);
    const y = -r * Math.cos(rad);

    arrowRef.current.style.left = `${cx + x}px`;
    arrowRef.current.style.top = `${cy + y}px`;

    arrowRef.current.style.transform = `translate(-50%, -50%) rotate(${pov.heading}deg)`;
  }, [pov?.heading]);

  if (!map || !latLng || !pov || !contentRef.current) return null;

  return (
    <AdvancedMarker map={map} markerRef={markerRef} content={contentRef.current} options={{
      position: latLng,
    }} />
  );
}
export default StreetViewPointMarker;