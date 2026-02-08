import { useStreetViewPanoramaStore } from "~/frontend/stores/googlemap/streetViewPanoramaStore";

const useStreetViewPanorama = () => {
  const { streetViewPanorama, setStreetViewPanorama, streetViewPanoramaCenter, streetViewPanoramaPov } = useStreetViewPanoramaStore();

  const initStreetViewPanorama = (map: google.maps.Map,panorama: google.maps.StreetViewPanorama) => {
    setStreetViewPanorama(panorama);
    map.setStreetView(panorama);
  };

  const moveStreetViewPanorama = (latLng: google.maps.LatLngLiteral) => {
    if (!streetViewPanorama) return;
    streetViewPanorama.setPosition(latLng);
  };

  return {
    streetViewPanorama,
    streetViewPanoramaCenter,
    streetViewPanoramaPov,
    initStreetViewPanorama,
    moveStreetViewPanorama,
  };
}

export default useStreetViewPanorama;