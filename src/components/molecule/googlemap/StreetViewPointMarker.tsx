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

  if (!contentRef.current && typeof document !== "undefined") {
    const el = document.createElement("div");
    el.style.backgroundColor = "#3B82F6";
    el.style.border = "2px solid white";
    el.style.boxShadow = "0 0 5px #3B82F6";
    el.style.borderRadius = "50%";
    el.style.textAlign = "center";
    el.style.height = "20px";
    el.style.width = "20px";
    contentRef.current = el;
  }

  // pov変化でDOMの見た目だけ更新
  useEffect(() => {
    if (!contentRef.current || !pov) return;
  }, [pov?.heading]);

  if (!map || !latLng || !pov || !contentRef.current) return null;

  return (
    <AdvancedMarker map={map} markerRef={markerRef} content={contentRef.current} options={{
      position: latLng,
    }} />
  );
}
export default StreetViewPointMarker;