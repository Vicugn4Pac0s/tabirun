import { useRef } from "react";
import AdvancedMarker from "~/components/atoms/googlemap/AdvancedMarker";

interface StreetViewPointMarkerProps {
  map: google.maps.Map | null;
  latLng: google.maps.LatLngLiteral;
}

export function StreetViewPointMarker({map, latLng}: StreetViewPointMarkerProps) {
  const markerRef = useRef(null)

  const content = document.createElement('div');
  content.style.backgroundColor = "#3B82F6";
  content.style.borderRadius = '50%';
  content.style.color = 'white';
  content.style.fontSize = '16px';
  content.style.fontWeight = 'bold';
  content.style.textAlign = 'center';
  content.style.lineHeight = '10px';
  content.style.width = '10px';
  
  return (
    <AdvancedMarker map={map} markerRef={markerRef} content={content} options={{
      position: latLng,
    }} />
  );
}
export default StreetViewPointMarker;