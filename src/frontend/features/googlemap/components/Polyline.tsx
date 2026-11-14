import { useEffect, useRef } from "react";

type PolylineProps = {
  map: google.maps.Map | null;
  path: google.maps.LatLngLiteral[];
  options?: Omit<google.maps.PolylineOptions, "map" | "path">;
};

/**
 * 初期化済みの地図へ線を追加し、座標列・オプションの変更を反映する。
 * 破棄時は線を地図から外す。React側の描画要素は返さない。
 */
export function Polyline({ map, path, options }: PolylineProps) {
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    const polyline = new google.maps.Polyline({ map });
    polylineRef.current = polyline;

    return () => {
      polyline.setMap(null);
      polylineRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    polylineRef.current?.setOptions({ ...options, map, path });
  }, [map, path, options]);

  return null;
}

export default Polyline;
