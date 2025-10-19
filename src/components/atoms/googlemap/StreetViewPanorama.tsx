import { useEffect, useRef } from "react";
import useStreetViewPanorama from "~/app/hooks/googlemap/useStreetViewPanorama";

interface StreetViewPanoramaProps {
  map: google.maps.Map | null;
  options: google.maps.StreetViewPanoramaOptions;
  onPositionChanged?: (position: google.maps.LatLng) => void;
  onPovChanged?: (position: google.maps.StreetViewPov) => void;
}

const StreetViewPanorama = ({ map, options, onPositionChanged, onPovChanged }: StreetViewPanoramaProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { initStreetViewPanorama } = useStreetViewPanorama();

  useEffect(() => {
    if (ref.current && map) {
      const panorama = new window.google.maps.StreetViewPanorama(
        ref.current,
        options
      );
      initStreetViewPanorama(map, panorama);
      panorama.addListener("position_changed", () => {
        const position = panorama.getPosition();
        if (position && onPositionChanged) {
          onPositionChanged(position);
        }
      });
      panorama.addListener("pov_changed", () => {
        const pov = panorama.getPov();
        if (pov && onPovChanged) {
          onPovChanged(pov);
        }
      });
    }
  }, [ref, map]);

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
};

export default StreetViewPanorama;