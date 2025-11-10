import { create } from "zustand";

interface RouteStore {
  routePoints: google.maps.LatLngLiteral[];
  addRoutePoint: (routePoint: google.maps.LatLngLiteral) => void;
  removeRoutePoint: (index: number) => void;
  removeRoutePointByLatLng: (latLng: google.maps.LatLngLiteral) => void;
  clearRoutePoints: () => void;
}

export const useRouteStore = create<RouteStore>((set) => ({
  routePoints: [],
  addRoutePoint: (routePoint) => set(state => ({ routePoints: [...state.routePoints, routePoint] })),
  removeRoutePoint: (index) => set(state => ({ routePoints: state.routePoints.filter((_, i) => i !== index) })),
  removeRoutePointByLatLng: (latLng) => set(state => ({ routePoints: state.routePoints.filter(p => p.lat !== latLng.lat || p.lng !== latLng.lng) })),
  clearRoutePoints: () => set({ routePoints: [] })
}));