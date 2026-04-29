import { create } from "zustand";

export interface SelectedRoute {
  id: number;
  title: string | null;
  points: google.maps.LatLngLiteral[];
  kilometers: number;
}

interface SelectedRouteStore {
  selectedRoute: SelectedRoute | null;
  selectRoute: (route: SelectedRoute) => void;
  clearSelectedRoute: () => void;
}

export const useSelectedRouteStore = create<SelectedRouteStore>((set) => ({
  selectedRoute: null,
  selectRoute: (route) => set({ selectedRoute: route }),
  clearSelectedRoute: () => set({ selectedRoute: null }),
}));
