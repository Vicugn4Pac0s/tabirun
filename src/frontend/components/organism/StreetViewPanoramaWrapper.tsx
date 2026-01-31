'use client';

import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { useMapStore } from "~/frontend/stores/googlemap/mapStore";
import StreetViewPanorama from "../atoms/googlemap/StreetViewPanorama";
import { useStreetViewPanoramaStore } from "~/frontend/stores/googlemap/streetViewPanoramaStore";

const StreetViewPanoramaWrapper = () => {
  const { map } = useMapStore();
  const { setStreetViewPanoramaCenter, setStreetViewPanoramaPov } = useStreetViewPanoramaStore();
  
  return (
    <div className="h-screen">
      <StreetViewPanorama
        map={map}
        options={{
          position: GOOGLE_MAP_DEFAULT_CENTER,
          pov: { heading: 165, pitch: 0 },
          zoomControl: false,
          addressControl: false,
          motionTrackingControl: false,
        }}
        onPositionChanged={(position) => {
          const positionLatLngLiteral = position.toJSON() as google.maps.LatLngLiteral;
          setStreetViewPanoramaCenter(positionLatLngLiteral);
        }}
        onPovChanged={(pov) => {
          setStreetViewPanoramaPov(pov);
        }}
      />
    </div>
  );
}
export default StreetViewPanoramaWrapper;