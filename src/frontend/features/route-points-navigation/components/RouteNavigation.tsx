"use client";

import { useEnterKey } from "~/frontend/hooks/shared/useEnterKey";
import { useMoveStreetView } from "../../googlemap/hooks/useMoveStreetView";
import { useRoutePoints } from "../../route-points/hooks/useRoutePoints";
import { useRoutePointAction } from "../hooks/useRoutePointAction";
import MainActionButton from "~/frontend/components/app-ui/MainActionButton";
import SubActionButton from "~/frontend/components/app-ui/SubActionButton";

interface RoutePointsNavigationProps {
  currentPoint: google.maps.LatLngLiteral;
  canEdit?: boolean;
}

const RoutePointsNavigation = ({
  currentPoint,
  canEdit = true,
}: RoutePointsNavigationProps) => {
  const moveStreetView = useMoveStreetView();
  const { canFirst, canPrev, canNext, canLast, firstRoutePoint, lastRoutePoint, prevRoutePoint, nextRoutePoint } = useRoutePoints(currentPoint);
  const { type, toggle } = useRoutePointAction(currentPoint);
  
  useEnterKey(() => {
    if (!canEdit) return;
    toggle();
  });

  return (
    <div className="bg-white flex gap-16 relative">
      <div className="flex">
        <SubActionButton type="first" disabled={!canFirst} onClick={()=>{
          if(!firstRoutePoint) return;
          void moveStreetView(firstRoutePoint);
        }} />
        <SubActionButton type="prev" disabled={!canPrev} onClick={()=>{
          if(!prevRoutePoint) return;
          void moveStreetView(prevRoutePoint);
        }} />
      </div>
      <div className="absolute left-1/2 bottom-1 -translate-x-1/2 z-10">
        <MainActionButton
          type={type}
          onClick={toggle}
          disabled={!canEdit}
        />
      </div>
      <div className="flex">
        <SubActionButton type="next" disabled={!canNext} onClick={()=>{
          if(!nextRoutePoint) return;
          void moveStreetView(nextRoutePoint);
        }} />
        <SubActionButton type="last" disabled={!canLast} onClick={()=>{
          if(!lastRoutePoint) return;
          void moveStreetView(lastRoutePoint);
        }} />
      </div>
    </div>
  );
};

export default RoutePointsNavigation;
