import { useEffect, useRef } from "react";
import useStreetViewPanorama from "~/app/hooks/googlemap/useStreetViewPanorama";

interface StreetViewPanoramaProps {
  map: google.maps.Map | null;
  options: google.maps.StreetViewPanoramaOptions;
}

const StreetViewPanorama = ({ map, options }: StreetViewPanoramaProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { initStreetViewPanorama } = useStreetViewPanorama();

  useEffect(() => {
    if (ref.current && map) {
      const panorama = new window.google.maps.StreetViewPanorama(
        ref.current,
        options
      );
      initStreetViewPanorama(map, panorama);
    }
  }, [ref, map]);

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
};

export default StreetViewPanorama;