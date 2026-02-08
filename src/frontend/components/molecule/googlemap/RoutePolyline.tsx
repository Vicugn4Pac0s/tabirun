import { useState } from "react";
import Polyline from "../../atoms/googlemap/Polyline";

interface RoutePolylineProps {
  map: google.maps.Map | null;
  polylineArray: google.maps.LatLngLiteral[];
}

export function RoutePolyline({map, polylineArray}: RoutePolylineProps) {
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);
  
  return (
    <Polyline map={map} polyline={polyline} setPolyline={setPolyline} options={{strokeColor: 'block', strokeWeight: 3, path: polylineArray}} />
  )
}
export default RoutePolyline;