import { useSelectedRouteStore } from "../stores/selectedRouteStore";

export function useRouteEditorState() {
  const selectedRoute = useSelectedRouteStore((state) => state.selectedRoute);
  const mode = useSelectedRouteStore((state) => state.mode);

  return {
    selectedRoute,
    mode,
    isViewingSavedRoute: Boolean(selectedRoute),
    canEditRoutePoints: !selectedRoute || mode === "edit",
  };
}
