import AdvancedMarker from "~/frontend/features/googlemap/components/AdvancedMarker";
import type { RouteMapMarker } from "../types";

type RoutePointMarkerProps = Omit<RouteMapMarker, "id"> & {
  map: google.maps.Map | null;
};

/** 指定された地図に、ラベルと読み上げ用の名前を持つ地点マーカーを配置する。 */
export function RoutePointMarker({
  map,
  position,
  label,
  title,
  color = "rgba(0, 0, 0, 0.6)",
  onClick,
}: RoutePointMarkerProps) {
  return (
    <AdvancedMarker
      map={map}
      onClick={onClick}
      position={position}
      title={title}
    >
      <div
        className="relative top-3.5 w-7 rounded-full text-center text-sm font-bold leading-7 text-white"
        style={{ backgroundColor: color }}
      >
        {label}
      </div>
    </AdvancedMarker>
  );
}
export default RoutePointMarker;
