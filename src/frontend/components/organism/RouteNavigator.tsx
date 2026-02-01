"use client";

import { useStreetViewPanoramaStore } from "~/frontend/stores/googlemap/streetViewPanoramaStore";
import { useRoutePointNavigator } from "~/frontend/hooks/googlemap/useRoutePointNavigator";
import { useMainActionButton } from "~/frontend/hooks/googlemap/useMainActionButton";
import MainActionButton from "../atoms/MainActionButton";
import SubActionButton from "../atoms/SubActionButton";

export const RouteNavigator = () => {
  const streetViewPanorama = useStreetViewPanoramaStore(
    (state) => state.streetViewPanorama,
  );
  const { canFirst, canPrev, canNext, canLast, firstRoutePoint, lastRoutePoint, prevRoutePoint, nextRoutePoint } = useRoutePointNavigator();
  const { mainActionButtonType, clickMainActionButton } = useMainActionButton();
  
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
      <div className="absolute left-1/2 bottom-1 -translate-x-1/2 z-10">
        <MainActionButton
          type={mainActionButtonType}
          onClick={clickMainActionButton}
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
