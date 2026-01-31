import { create } from "zustand";

interface RouteDirectionsStore {
  key: string | null;
  routeDirections: google.maps.DirectionsResult | null;
  setRouteDirections: (key: string, directions: google.maps.DirectionsResult | null) => void;
}

export const useRouteDirectionsStore = create<RouteDirectionsStore>((set) => ({
  key: null,
  routeDirections: null,
  setRouteDirections: (key, directions) =>
    set((prev) => {
      if (prev.key === key) return prev;
      return { key, routeDirections: directions };
    }),
}));