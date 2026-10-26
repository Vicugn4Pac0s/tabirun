import { useEffect, useRef, type MutableRefObject } from "react";

interface StreetViewProps {
  map: google.maps.Map | null;
  streetView: MutableRefObject<google.maps.StreetViewPanorama | null>;
  options: google.maps.StreetViewPanoramaOptions;
  onInit?: () => void;
  onPositionChanged?: (position: google.maps.LatLng) => void;
  onPovChanged?: (position: google.maps.StreetViewPov) => void;
}

const StreetView = ({
  map,
  streetView,
  options,
  onInit,
  onPositionChanged,
  onPovChanged,
}: StreetViewProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const optionsRef = useRef(options);
  const callbacksRef = useRef({ onInit, onPositionChanged, onPovChanged });

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    callbacksRef.current = { onInit, onPositionChanged, onPovChanged };
  }, [onInit, onPositionChanged, onPovChanged]);

  useEffect(() => {
    if (!ref.current || !map) {
      return;
    }

    const panorama = new window.google.maps.StreetViewPanorama(
      ref.current,
      optionsRef.current,
    );
    const notifyPosition = () => {
      const position = panorama.getPosition();
      if (position) {
        callbacksRef.current.onPositionChanged?.(position);
      }
    };
    const notifyPov = () => {
      const pov = panorama.getPov();
      if (pov) {
        callbacksRef.current.onPovChanged?.(pov);
      }
    };
    const positionChangedListener = panorama.addListener(
      "position_changed",
      notifyPosition,
    );
    const povChangedListener = panorama.addListener("pov_changed", notifyPov);
    streetView.current = panorama;

    // 初期値の設定時に発生したイベントは、リスナー登録後には届かない。
    notifyPosition();
    notifyPov();
    callbacksRef.current.onInit?.();

    return () => {
      panorama.setVisible(false);
      positionChangedListener.remove();
      povChangedListener.remove();

      if (streetView.current === panorama) {
        streetView.current = null;
      }
    };
  }, [map, streetView]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
};

export default StreetView;
