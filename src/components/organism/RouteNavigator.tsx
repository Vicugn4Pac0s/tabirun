'use client';

import { useEffect, useState } from "react";
import { useRouteStore } from "~/app/stores/googlemap/routeStore";
import { useStreetViewPanoramaStore } from "~/app/stores/googlemap/streetViewPanoramaStore";
import MainActionButton from "../atoms/MainActionButton";

export const RouteNavigator = () => {
  const routePoints = useRouteStore((state) => state.routePoints);
  const addRoutePoint = useRouteStore((state) => state.addRoutePoint);
  const removeRoutePointByLatLng = useRouteStore((state) => state.removeRoutePointByLatLng);
  const streetViewPanoramaCenter = useStreetViewPanoramaStore((state) => state.streetViewPanoramaCenter);
  const [mainActionButtonType, setMainActionButtonType] = useState<'add' | 'delete'>('add');

  useEffect(() => {
    if (!streetViewPanoramaCenter) return;
    const exists = routePoints.some(
      (p) =>
        p.lat === streetViewPanoramaCenter.lat &&
        p.lng === streetViewPanoramaCenter.lng
    );
    setMainActionButtonType(exists ? "delete" : "add");
  }, [routePoints, streetViewPanoramaCenter]);

  return (
    <div className="flex items-center">
      <MainActionButton type={mainActionButtonType} onClick={() => {
        if(!streetViewPanoramaCenter) return;
        if(mainActionButtonType === 'add') {
          addRoutePoint(streetViewPanoramaCenter);
        } else if(mainActionButtonType === 'delete') {
          removeRoutePointByLatLng(streetViewPanoramaCenter);
        }
      }} />
    </div>
  );
};