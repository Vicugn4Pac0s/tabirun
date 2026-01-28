"use client";

import { useEffect, useState } from "react";
import { useRoutePointsStore } from "~/app/stores/googlemap/routePointsStore";
import { useStreetViewPanoramaStore } from "~/app/stores/googlemap/streetViewPanoramaStore";
import { useRoutePointNavigator } from "~/app/hooks/googlemap/useRoutePointNavigator";
import MainActionButton from "../atoms/MainActionButton";
import SubActionButton from "../atoms/SubActionButton";

export const RouteNavigator = () => {
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const addRoutePoint = useRoutePointsStore((state) => state.addRoutePoint);
  const removeRoutePointByLatLng = useRoutePointsStore(
    (state) => state.removeRoutePointByLatLng,
  );
  const streetViewPanorama = useStreetViewPanoramaStore(
    (state) => state.streetViewPanorama,
  );
  const streetViewPanoramaCenter = useStreetViewPanoramaStore(
    (state) => state.streetViewPanoramaCenter,
  );

  const { canFirst, canPrev, canNext, canLast, firstRoutePoint, lastRoutePoint, prevRoutePoint, nextRoutePoint } = useRoutePointNavigator();
  
  const [mainActionButtonType, setMainActionButtonType] = useState<
    "add" | "delete"
  >("add");

  useEffect(() => {
    if (!streetViewPanoramaCenter) return;
    const exists = routePoints.some(
      (p) =>
        p.lat === streetViewPanoramaCenter.lat &&
        p.lng === streetViewPanoramaCenter.lng,
    );
    setMainActionButtonType(exists ? "delete" : "add");
  }, [routePoints, streetViewPanoramaCenter]);

  return (
    <div className="bg-white flex gap-16 relative">
      <div className="flex">
        <SubActionButton type="first" disabled={!canFirst} onClick={()=>{
          if(!firstRoutePoint) return;
          streetViewPanorama?.setPosition(firstRoutePoint);
        }} />
        <SubActionButton type="prev" disabled={!canPrev} onClick={()=>{
          if(!prevRoutePoint) return;
          streetViewPanorama?.setPosition(prevRoutePoint);
        }} />
      </div>
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 z-10">
        <MainActionButton
          type={mainActionButtonType}
          onClick={() => {
            if (!streetViewPanoramaCenter) return;
            if (mainActionButtonType === "add") {
              addRoutePoint(streetViewPanoramaCenter);
            } else if (mainActionButtonType === "delete") {
              removeRoutePointByLatLng(streetViewPanoramaCenter);
            }
          }}
        />
      </div>
      <div className="flex">
        <SubActionButton type="next" disabled={!canNext} onClick={()=>{
          if(!nextRoutePoint) return;
          streetViewPanorama?.setPosition(nextRoutePoint);
        }} />
        <SubActionButton type="last" disabled={!canLast} onClick={()=>{
          if(!lastRoutePoint) return;
          streetViewPanorama?.setPosition(lastRoutePoint);
        }} />
      </div>
    </div>
  );
};
