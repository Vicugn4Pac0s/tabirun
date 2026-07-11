import { useCallback } from "react";
import { useGoogleMap } from "../providers/GoogleMapProvider";

const STREET_VIEW_SEARCH_RADIUS_METERS = 50;
const MAX_STREET_VIEW_SNAP_DISTANCE_METERS = 30;

function getDistanceMeters(
  from: google.maps.LatLngLiteral,
  to: google.maps.LatLngLiteral
) {
  const earthRadiusMeters = 6371000;
  const latDiff = ((to.lat - from.lat) * Math.PI) / 180;
  const lngDiff = ((to.lng - from.lng) * Math.PI) / 180;
  const fromLatRad = (from.lat * Math.PI) / 180;
  const toLatRad = (to.lat * Math.PI) / 180;

  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(fromLatRad) *
      Math.cos(toLatRad) *
      Math.sin(lngDiff / 2) *
      Math.sin(lngDiff / 2);

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const useMoveStreetView = () => {
  const { streetView, setStreetViewUnavailable } = useGoogleMap();

  const moveStreetView = useCallback(
    async (position: google.maps.LatLng | google.maps.LatLngLiteral) => {
      if (!streetView.current || typeof window === "undefined") {
        return false;
      }

      const requestedPosition =
        position instanceof window.google.maps.LatLng
          ? position.toJSON()
          : position;

      const streetViewService = new window.google.maps.StreetViewService();
      const panorama = await new Promise<google.maps.StreetViewPanoramaData | null>(
        (resolve) => {
          void streetViewService.getPanorama(
            {
              location: requestedPosition,
              radius: STREET_VIEW_SEARCH_RADIUS_METERS,
            },
            (data, status) => {
              if (
                status === window.google.maps.StreetViewStatus.OK &&
                data?.location?.latLng
              ) {
                resolve(data);
                return;
              }

              resolve(null);
            }
          );
        }
      );

      const resolvedPosition = panorama?.location?.latLng?.toJSON();
      if (
        !resolvedPosition ||
        getDistanceMeters(requestedPosition, resolvedPosition) >
          MAX_STREET_VIEW_SNAP_DISTANCE_METERS
      ) {
        setStreetViewUnavailable(true);
        return false;
      }

      setStreetViewUnavailable(false);
      streetView.current.setPosition(resolvedPosition);
      streetView.current.setVisible(true);
      return true;
    },
    [setStreetViewUnavailable, streetView]
  );

  return moveStreetView;
};
