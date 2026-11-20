import AdvancedMarker from "./AdvancedMarker";

interface StreetViewPointMarkerProps {
  map: google.maps.Map | null;
  latLng: google.maps.LatLngLiteral | null;
  pov: google.maps.StreetViewPov | null;
}

/**
 * Street Viewの位置と方角を点と矢印で地図上に表示する。
 * 地図・位置・視点が揃うまでは何も表示しない。
 */
export function StreetViewPointMarker({
  map,
  latLng,
  pov,
}: StreetViewPointMarkerProps) {
  if (!map || !latLng || !pov) return null;

  const center = 10;
  const radius = 16;
  const radians = (pov.heading * Math.PI) / 180;

  return (
    <AdvancedMarker map={map} options={{ position: latLng }}>
      <div className="relative top-2.5 h-5 w-5">
        <div className="absolute left-0 top-0 box-border h-5 w-5 rounded-full border-2 border-white bg-primary shadow-[0_0_5px_hsl(var(--primary))]" />
        <div
          className="pointer-events-none absolute h-0 w-0 border-x-[6px] border-b-[10px] border-x-transparent border-b-primary"
          style={{
            // 北0度を上に：x=sin, y=-cos
            left: center + radius * Math.sin(radians),
            top: center - radius * Math.cos(radians),
            transform: `translate(-50%, -50%) rotate(${pov.heading}deg)`,
          }}
        />
      </div>
    </AdvancedMarker>
  );
}
export default StreetViewPointMarker;
