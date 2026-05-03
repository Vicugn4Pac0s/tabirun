"use client";

import { useRouteEditorState } from "../hooks/useRouteEditorState";
import RouteDetailEdit from "./RouteDetailEdit";
import RouteDetailReadonly from "./RouteDetailReadonly";

function RouteDetailView() {
  const { selectedRoute, mode } = useRouteEditorState();

  if (!selectedRoute) {
    return null;
  }

  if (mode === "edit") {
    return <RouteDetailEdit selectedRoute={selectedRoute} />;
  }

  return <RouteDetailReadonly selectedRoute={selectedRoute} />;
}

export default RouteDetailView;
