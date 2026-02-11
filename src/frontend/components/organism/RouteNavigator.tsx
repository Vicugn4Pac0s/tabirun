"use client";

import { useEnterKey } from "~/frontend/hooks/useEnterKey";
import { useRoutePointNavigator } from "~/frontend/hooks/googlemap/useRoutePointNavigator";
import { useMainActionButton } from "~/frontend/hooks/googlemap/useMainActionButton";
import useStreetViewPanorama from "~/frontend/hooks/googlemap/useStreetViewPanorama";
import MainActionButton from "../atoms/MainActionButton";
import SubActionButton from "../atoms/SubActionButton";

const RouteNavigator = () => {
  const { streetViewPanorama, moveStreetViewPanorama } = useStreetViewPanorama();
  const { canFirst, canPrev, canNext, canLast, firstRoutePoint, lastRoutePoint, prevRoutePoint, nextRoutePoint } = useRoutePointNavigator();
  const { mainActionButtonType, clickMainActionButton } = useMainActionButton();
  
  useEnterKey(() => {
    clickMainActionButton();
  });

  return (
    <div className="bg-white flex gap-16 relative">
      <div className="flex">
        <SubActionButton type="first" disabled={!canFirst} onClick={()=>{
          if(!firstRoutePoint) return;
          moveStreetViewPanorama(firstRoutePoint);
        }} />
        <SubActionButton type="prev" disabled={!canPrev} onClick={()=>{
          if(!prevRoutePoint) return;
          moveStreetViewPanorama(prevRoutePoint);
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
          moveStreetViewPanorama(nextRoutePoint);
        }} />
        <SubActionButton type="last" disabled={!canLast} onClick={()=>{
          if(!lastRoutePoint) return;
          moveStreetViewPanorama(lastRoutePoint);
        }} />
      </div>
    </div>
  );
};

export default RouteNavigator;