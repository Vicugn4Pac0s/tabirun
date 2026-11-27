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
  color = "var(--map-marker-via)",
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
        className="relative top-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-sm font-bold text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {label}
      </div>
    </AdvancedMarker>
  );
}
export default RoutePointMarker;
