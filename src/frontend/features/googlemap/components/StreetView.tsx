import { MutableRefObject, useEffect, useRef } from "react";

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
    if (ref.current && map) {
      const panorama = new window.google.maps.StreetViewPanorama(
        ref.current,
        options,
      );
      const notifyPosition = () => {
        const position = panorama.getPosition();
        if (position && onPositionChanged) {
          onPositionChanged(position);
        }
      };
      const notifyPov = () => {
        const pov = panorama.getPov();
        if (pov && onPovChanged) {
          onPovChanged(pov);
        }
      };
      panorama.addListener("position_changed", notifyPosition);
      panorama.addListener("pov_changed", notifyPov);
      if (streetView) {
        streetView.current = panorama;
      }
      // 初期値の設定時に発生したイベントは、リスナー登録後には届かない。
      notifyPosition();
      notifyPov();
    }
  }, [ref, map]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
};

export default StreetView;
