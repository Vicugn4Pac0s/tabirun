import { useRef } from "react";
import AdvancedMarker from "~/components/atoms/googlemap/AdvancedMarker";

interface StreetViewPointMarkerProps {
  map: google.maps.Map | null;
  latLng: google.maps.LatLngLiteral | null;
  pov: google.maps.StreetViewPov | null;
}

export function StreetViewPointMarker({map, latLng, pov}: StreetViewPointMarkerProps) {
  if(!map || !latLng || !pov) return null;

  const markerRef = useRef(null)

  const content = document.createElement('div');
  content.innerHTML = '';
  content.style.backgroundColor = "#3B82F6";
  content.style.border = '2px solid white';
  content.style.boxShadow = '0 0 5px #3B82F6';
  content.style.borderRadius = '50%';
  content.style.textAlign = 'center';
  content.style.height = '20px';
  content.style.width = '20px';

  return (
    <AdvancedMarker map={map} markerRef={markerRef} content={content} options={{
      position: latLng,
    }} />
  );
}
export default StreetViewPointMarker;