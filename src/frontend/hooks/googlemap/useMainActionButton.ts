import { useEffect, useState } from "react";
import { useEnterKey } from "../useEnterKey";
import { useStreetViewPanoramaStore } from "~/frontend/stores/googlemap/streetViewPanoramaStore";
import { useRoutePointsStore } from "~/frontend/stores/googlemap/routePointsStore";
import { useRoutePointNavigator } from "./useRoutePointNavigator";

export const useMainActionButton = () => {
  const streetViewPanoramaCenter = useStreetViewPanoramaStore(
    (state) => state.streetViewPanoramaCenter,
  );
  const addRoutePoint = useRoutePointsStore((state) => state.addRoutePoint);
  const removeRoutePointByLatLng = useRoutePointsStore(
    (state) => state.removeRoutePointByLatLng,
  );
  const { isInRoute } = useRoutePointNavigator();
  
  const [mainActionButtonType, setMainActionButtonType] = useState<
    "add" | "delete"
  >("add");

  useEffect(() => {
    setMainActionButtonType(isInRoute ? "delete" : "add");
  }, [isInRoute]);

  useEnterKey(() => {
    clickMainActionButton();
  });

  const clickMainActionButton = () => {
    if (!streetViewPanoramaCenter) return;
    if (mainActionButtonType === "add") {
      addRoutePoint(streetViewPanoramaCenter);
    } else if (mainActionButtonType === "delete") {
      removeRoutePointByLatLng(streetViewPanoramaCenter);
    }
  }

  return { mainActionButtonType, clickMainActionButton };
}