'use client';

import { GOOGLE_MAP_DEFAULT_CENTER } from "~/app/config";
import { useMapStore } from "~/app/stores//googlemap/mapStore";
import StreetViewPanorama from "../atoms/googlemap/StreetViewPanorama";

const StreetViewPanoramaWrapper = () => {
  const { map } = useMapStore();
  return (
    <div className="h-screen">
      <StreetViewPanorama map={map} options={{
        position: GOOGLE_MAP_DEFAULT_CENTER,
        pov: { heading: 165, pitch: 0 },
        zoomControl: false,
        addressControl: false,
        motionTrackingControl: false,
      }} />
    </div>
  );
}
export default StreetViewPanoramaWrapper;