'use client';

import { useRouteStore } from "~/app/stores/googlemap/routeStore";
import MainActionButton from "../atoms/MainActionButton";
import { useStreetViewPanoramaStore } from "~/app/stores/googlemap/streetViewPanoramaStore";

export const RouteNavigator = () => {
  const addRoutePoint = useRouteStore((state) => state.addRoutePoint);
  const streetViewPanoramaCenter = useStreetViewPanoramaStore((state) => state.streetViewPanoramaCenter);


  return (
    <div className="flex items-center">
      <MainActionButton type="add" onClick={() => {
        if(!streetViewPanoramaCenter) return;
        addRoutePoint(streetViewPanoramaCenter);
      }} />
    </div>
  );
};