import { create } from "zustand";

interface MapStore {
  map: google.maps.Map | null;
  setMap: (map: google.maps.Map) => void;
  center: google.maps.LatLngLiteral | null;
  setCenter: (center: google.maps.LatLngLiteral | null) => void;
  zoom: number | null;
  setZoom: (zoom: number | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  map: null,
  setMap: (map) => set({ map }),
  center: null,
  setCenter: (center) => set({ center }),
  zoom: null,
  setZoom: (zoom) => set({ zoom })
}));