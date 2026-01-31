import { useStreetViewPanoramaStore } from "~/frontend/stores/googlemap/streetViewPanoramaStore";

const useStreetViewPanorama = () => {
  const { streetViewPanorama, setStreetViewPanorama } = useStreetViewPanoramaStore();

  const initStreetViewPanorama = (map: google.maps.Map,panorama: google.maps.StreetViewPanorama) => {
    setStreetViewPanorama(panorama);
    map.setStreetView(panorama);
  };

  return {
    streetViewPanorama,
    initStreetViewPanorama,
  };
}

export default useStreetViewPanorama;