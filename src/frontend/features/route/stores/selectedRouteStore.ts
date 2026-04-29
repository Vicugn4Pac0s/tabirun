import { create } from "zustand";

export type SelectedRouteMode = "view" | "edit";

export interface SelectedRoute {
  id: number;
  title: string | null;
  points: google.maps.LatLngLiteral[];
  kilometers: number;
}

interface SelectedRouteStore {
  selectedRoute: SelectedRoute | null;
  mode: SelectedRouteMode;
  draftTitle: string;
  selectRoute: (route: SelectedRoute) => void;
  setMode: (mode: SelectedRouteMode) => void;
  setDraftTitle: (title: string) => void;
  clearSelectedRoute: () => void;
}

export const useSelectedRouteStore = create<SelectedRouteStore>((set) => ({
  selectedRoute: null,
  mode: "view",
  draftTitle: "",
  selectRoute: (route) =>
    set({
      selectedRoute: route,
      mode: "view",
      draftTitle: route.title ?? "",
    }),
  setMode: (mode) => set({ mode }),
  setDraftTitle: (draftTitle) => set({ draftTitle }),
  clearSelectedRoute: () => set({ selectedRoute: null, mode: "view", draftTitle: "" }),
}));
