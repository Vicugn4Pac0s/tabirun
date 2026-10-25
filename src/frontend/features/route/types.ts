export type RouteMapMarker = {
  id: string;
  position: google.maps.LatLngLiteral;
  label: string;
  title: string;
  color?: string;
  onClick?: () => void;
};
