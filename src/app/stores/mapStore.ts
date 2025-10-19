import { create } from "zustand";
import { GOOGLE_MAP_DEFAULT_CENTER, GOOGLE_MAP_DEFAULT_ZOOM } from "../config";

interface MapStore {
  map: google.maps.Map | null;
  setMap: (map: google.maps.Map) => void;
  center: google.maps.LatLngLiteral;
  setCenter: (center: google.maps.LatLngLiteral) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  streetViewPanorama: google.maps.StreetViewPanorama | null;
  setStreetViewPanorama: (streetViewPanorama: google.maps.StreetViewPanorama) => void;
  directionsService: google.maps.DirectionsService | null;
  setDirectionsService: (directionsService: google.maps.DirectionsService) => void;
  directionsRenderer: google.maps.DirectionsRenderer | null;
  setDirectionsRenderer: (directionsRenderer: google.maps.DirectionsRenderer) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  map: null,
  setMap: (map) => set({ map }),
  center: GOOGLE_MAP_DEFAULT_CENTER,
  setCenter: (center) => set({ center }),
  zoom: GOOGLE_MAP_DEFAULT_ZOOM,
  setZoom: (zoom) => set({ zoom }),
  streetViewPanorama: null,
  setStreetViewPanorama: (streetViewPanorama) => set({ streetViewPanorama }),
  directionsService: null,
  setDirectionsService: (directionsService) => set({ directionsService }),
  directionsRenderer: null,
  setDirectionsRenderer: (directionsRenderer) => set({ directionsRenderer })
}));