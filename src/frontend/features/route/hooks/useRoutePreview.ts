import { useCallback, useState } from "react";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import { useGoogleMap } from "~/frontend/features/googlemap/providers/GoogleMapProvider";

export function useRoutePreview() {
  const { streetView, streetViewUnavailable, setStreetViewUnavailable } =
    useGoogleMap();
  const moveStreetView = useMoveStreetView();
  const [position, setPosition] = useState<google.maps.LatLngLiteral | null>(
    null,
  );
  const [pov, setPov] = useState<google.maps.StreetViewPov | null>(null);

  const previewPoint = useCallback(
    async (point: google.maps.LatLngLiteral) => {
      try {
        await moveStreetView(point);
      } catch {
        setStreetViewUnavailable(true);
      }
    },
    [moveStreetView, setStreetViewUnavailable],
  );

  return {
    streetView,
    streetViewUnavailable,
    position,
    setPosition,
    pov,
    setPov,
    previewPoint,
  };
}
