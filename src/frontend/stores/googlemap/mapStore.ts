import { create } from "zustand";

interface MapStore {
  map: google.maps.Map | null;
  setMap: (map: google.maps.Map) => void;
  center: google.maps.LatLngLiteral | null;
  setCenter: (center: google.maps.LatLngLiteral | null) => void;
  zoom: number | null;
  setZoom: (zoom: number | null) => void;
  directionsService: google.maps.DirectionsService | null;
  setDirectionsService: (directionsService: google.maps.DirectionsService) => void;
  directionsRenderer: google.maps.DirectionsRenderer | null;
  setDirectionsRenderer: (directionsRenderer: google.maps.DirectionsRenderer) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  map: null,
  setMap: (map) => set({ map }),
  center: null,
  setCenter: (center) => set({ center }),
  zoom: null,
  setZoom: (zoom) => set({ zoom }),
  directionsService: null,
  setDirectionsService: (directionsService) => set({ directionsService }),
  directionsRenderer: null,
  setDirectionsRenderer: (directionsRenderer) => set({ directionsRenderer })
}));