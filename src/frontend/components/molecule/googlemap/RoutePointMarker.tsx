import { useRef } from "react";
import AdvancedMarker from "~/frontend/components/atoms/googlemap/AdvancedMarker";

interface RoutePointMarkerProps {
  map: google.maps.Map | null;
  latLng: google.maps.LatLngLiteral;
  index: number;
  onClick?: () => void;
}

export function RoutePointMarker({map, latLng, index, onClick}: RoutePointMarkerProps) {
  const markerRef = useRef(null)

  const SIZE = 28;

  const content = document.createElement('div');
  content.innerHTML = (index + 1).toString();
  content.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
  content.style.borderRadius = '50%';
  content.style.color = 'white';
  content.style.fontSize = '14px';
  content.style.fontWeight = 'bold';
  content.style.textAlign = 'center';
  content.style.lineHeight = `${SIZE}px`;
  content.style.width = `${SIZE}px`;
  content.style.position = 'relative';
  content.style.top = `${SIZE / 2}px`;
  
  return (
    <AdvancedMarker map={map} markerRef={markerRef} content={content} onClick={()=>{
      onClick?.()
    }} options={{
      position: latLng,
    }} />
  );
}
export default RoutePointMarker;