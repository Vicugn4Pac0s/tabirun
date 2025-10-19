import { create } from "zustand";

interface StreetViewPanoramaStore {
  streetViewPanorama: google.maps.StreetViewPanorama | null;
  setStreetViewPanorama: (streetViewPanorama: google.maps.StreetViewPanorama) => void;
  streetViewPanoramaCenter: google.maps.LatLngLiteral | null;
  setStreetViewPanoramaCenter: (center: google.maps.LatLngLiteral) => void;
  streetViewPanoramaPov: google.maps.StreetViewPov | null;
  setStreetViewPanoramaPov: (pov: google.maps.StreetViewPov) => void;
}

export const useStreetViewPanoramaStore = create<StreetViewPanoramaStore>((set) => ({
  streetViewPanorama: null,
  setStreetViewPanorama: (streetViewPanorama) => set({ streetViewPanorama }),
  streetViewPanoramaCenter: null,
  setStreetViewPanoramaCenter: (center) => set({ streetViewPanoramaCenter: center }),
  streetViewPanoramaPov: null,
  setStreetViewPanoramaPov: (pov) => set({ streetViewPanoramaPov: pov }),
}));