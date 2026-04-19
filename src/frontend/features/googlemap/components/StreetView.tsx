import { MutableRefObject, useEffect, useRef } from "react";

interface StreetViewProps {
  map: google.maps.Map | null;
  streetView: MutableRefObject<google.maps.StreetViewPanorama | null>;
  options: google.maps.StreetViewPanoramaOptions;
  onPositionChanged?: (position: google.maps.LatLng) => void;
  onPovChanged?: (position: google.maps.StreetViewPov) => void;
}

const StreetView = ({ map, streetView, options, onPositionChanged, onPovChanged }: StreetViewProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && map) {
      const panorama = new window.google.maps.StreetViewPanorama(
        ref.current,
        options
      );
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
      if (streetView) {
        streetView.current = panorama;
      }
    }
  }, [ref, map]);

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
};

export default StreetView;