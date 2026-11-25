"use client";

import { ROUTE_POINTS_MAX } from "~/shared/schemas";
import { useEnterKey } from "~/frontend/hooks/shared/useEnterKey";
import MainActionButton from "./MainActionButton";
import SubActionButton from "./SubActionButton";

type RouteNavigationProps = {
  points: google.maps.LatLngLiteral[];
  currentPoint: google.maps.LatLngLiteral;
  onMove: (point: google.maps.LatLngLiteral) => void;
  onToggle: () => void;
  disabled?: boolean;
};

/**
 * 登録地点の前後移動と、現在地点の追加・削除を呼出側へ通知する。
 * 保存中・追加上限時以外はEnterキーでも切替を通知する。登録外の現在地点からは前後移動できない。
 */
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
  const toggleDisabled =
    disabled || (index < 0 && points.length >= ROUTE_POINTS_MAX);
  const canPrev = index > 0;
  const canNext = index >= 0 && index < points.length - 1;
  const move = (targetIndex: number) => {
    const point = points[targetIndex];
    if (point) onMove(point);
  };
  useEnterKey(onToggle, { enabled: !toggleDisabled });

  return (
    <div className="flex h-16 w-max items-center rounded-lg border border-border bg-background px-2 md:h-20">
      <div className="grid min-w-0 grid-cols-2">
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
      <div className="relative -top-2 z-10">
        <MainActionButton
          type={index >= 0 ? "delete" : "add"}
          onClick={onToggle}
          disabled={toggleDisabled}
        />
      </div>
      <div className="grid min-w-0 grid-cols-2">
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
