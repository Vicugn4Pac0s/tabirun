"use client";

import { useEnterKey } from "~/frontend/hooks/shared/useEnterKey";
import MainActionButton from "~/frontend/components/app-ui/MainActionButton";
import SubActionButton from "~/frontend/components/app-ui/SubActionButton";

type RouteNavigationProps = {
  points: google.maps.LatLngLiteral[];
  currentPoint: google.maps.LatLngLiteral;
  onMove: (point: google.maps.LatLngLiteral) => void;
  onToggle: () => void;
  disabled?: boolean;
};

export function RouteNavigation({
  points,
  currentPoint,
  onMove,
  onToggle,
  disabled = false,
}: RouteNavigationProps) {
  const index = points.findIndex(
    (point) => point.lat === currentPoint.lat && point.lng === currentPoint.lng,
  );
  const canPrev = index > 0;
  const canNext = index >= 0 && index < points.length - 1;
  const move = (targetIndex: number) => {
    const point = points[targetIndex];
    if (point) onMove(point);
  };
  useEnterKey(onToggle, { enabled: !disabled });

  return (
    <div className="relative flex gap-16 bg-white">
      <div className="flex">
        <SubActionButton
          type="first"
          disabled={disabled || !canPrev}
          onClick={() => move(0)}
        />
        <SubActionButton
          type="prev"
          disabled={disabled || !canPrev}
          onClick={() => move(index - 1)}
        />
      </div>
      <div className="absolute bottom-1 left-1/2 z-10 -translate-x-1/2">
        <MainActionButton
          type={index >= 0 ? "delete" : "add"}
          onClick={onToggle}
          disabled={disabled}
        />
      </div>
      <div className="flex">
        <SubActionButton
          type="next"
          disabled={disabled || !canNext}
          onClick={() => move(index + 1)}
        />
        <SubActionButton
          type="last"
          disabled={disabled || !canNext}
          onClick={() => move(points.length - 1)}
        />
      </div>
    </div>
  );
}
