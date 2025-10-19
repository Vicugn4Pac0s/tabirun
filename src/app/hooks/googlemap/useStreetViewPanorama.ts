import { useMapStore } from "~/app/stores/mapStore";

const useStreetViewPanorama = () => {
  const { streetViewPanorama, setStreetViewPanorama } = useMapStore();

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