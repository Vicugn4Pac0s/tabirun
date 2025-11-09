import { create } from "zustand";

interface RouteStore {
  routePoints: google.maps.LatLngLiteral[];
  addRoutePoint: (routePoint: google.maps.LatLngLiteral) => void;
  removeRoutePoint: (index: number) => void;
  clearRoutePoints: () => void;
}

export const useRouteStore = create<RouteStore>((set) => ({
  routePoints: [],
  addRoutePoint: (routePoint) => set(state => ({ routePoints: [...state.routePoints, routePoint] })),
  removeRoutePoint: (index) => set(state => ({ routePoints: state.routePoints.filter((_, i) => i !== index) })),
  clearRoutePoints: () => set({ routePoints: [] })
}));