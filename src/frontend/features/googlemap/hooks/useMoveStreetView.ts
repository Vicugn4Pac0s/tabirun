import { useCallback } from "react";
import { useGoogleMap } from "../providers/GoogleMapProvider";

export const useMoveStreetView = () => {
  const { streetView } = useGoogleMap();

  const moveStreetView = useCallback(
    (position: google.maps.LatLng | google.maps.LatLngLiteral) => {
      if (streetView.current) {
        streetView.current.setPosition(position);
        streetView.current.setVisible(true);
      }
    },
    [streetView]
  );

  return moveStreetView;
};