import { useEffect, useRef, type MutableRefObject } from "react";

interface StreetViewProps {
  map: google.maps.Map | null;
  streetView: MutableRefObject<google.maps.StreetViewPanorama | null>;
  options: google.maps.StreetViewPanoramaOptions;
  onPositionChanged?: (position: google.maps.LatLng) => void;
  onPovChanged?: (position: google.maps.StreetViewPov) => void;
}

const StreetView = ({
  map,
  streetView,
  options,
  onPositionChanged,
  onPovChanged,
}: StreetViewProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !map) {
      return;
    }

    const panorama = new window.google.maps.StreetViewPanorama(
      ref.current,
      options,
    );
    const positionChangedListener = panorama.addListener(
      "position_changed",
      () => {
        const position = panorama.getPosition();
        if (position && onPositionChanged) {
          onPositionChanged(position);
        }
      },
    );
    const povChangedListener = panorama.addListener("pov_changed", () => {
      const pov = panorama.getPov();
      if (pov && onPovChanged) {
        onPovChanged(pov);
      }
    });
    streetView.current = panorama;

    return () => {
      positionChangedListener.remove();
      povChangedListener.remove();

      if (streetView.current === panorama) {
        streetView.current = null;
      }
    };
  }, [map, onPositionChanged, onPovChanged, options, streetView]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
};

export default StreetView;
