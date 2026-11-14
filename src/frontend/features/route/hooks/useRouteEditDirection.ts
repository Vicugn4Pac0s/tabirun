import type { RouterOutputs } from "~/trpc/react";
import { useRoutePolylinePath } from "~/frontend/features/googlemap/hooks/useRoutePolylinePath";
import { getRouteCalculationWarningMessage } from "../lib/getRouteCalculationWarningMessage";

type SavedRoute = Pick<
  RouterOutputs["route"]["getById"],
  "points" | "direction" | "directionErrorCode"
>;

/**
 * 編集地点の経路と警告を返す。保存時と同じ地点・順序なら保存済み経路を使う。
 * 地点変更後だけ再計算し、元に戻せば保存済み経路の表示へ戻す。
 */
export function useRouteEditDirection(
  route: SavedRoute,
  points: SavedRoute["points"],
) {
  const pointsChanged =
    points.length !== route.points.length ||
    points.some((point, index) => {
      const saved = route.points[index];
      return point.lat !== saved?.lat || point.lng !== saved?.lng;
    });
  const calculated = useRoutePolylinePath(points, {
    canUseDirections: pointsChanged,
  });

  if (pointsChanged) {
    return {
      polylinePath: calculated.polylinePath,
      directions: calculated.directions,
      isLoading: calculated.isLoading,
      warningMessage: getRouteCalculationWarningMessage(
        calculated.error,
        "editable",
      ),
    };
  }

  const warningCode =
    route.direction?.directionSource === "straight_line"
      ? "TOO_MANY_REQUESTS"
      : route.directionErrorCode;
  return {
    polylinePath: route.direction?.path ?? null,
    directions: route.direction,
    isLoading: false,
    warningMessage: getRouteCalculationWarningMessage(
      warningCode ? { data: { code: warningCode } } : null,
      "editable",
    ),
  };
}
