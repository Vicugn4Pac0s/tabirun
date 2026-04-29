"use client";

import { Button } from "~/frontend/components/ui/button";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import RunDetailOverview from "~/app/_components/RunDetailOverview";
import { useSelectedRouteStore } from "../stores/selectedRouteStore";

function RouteDetailView() {
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const clearRoutePoints = useRoutePointsStore((state) => state.clearRoutePoints);
  const selectedRoute = useSelectedRouteStore((state) => state.selectedRoute);
  const clearSelectedRoute = useSelectedRouteStore(
    (state) => state.clearSelectedRoute,
  );

  if (!selectedRoute) {
    return null;
  }

  return (
    <RunDetailOverview
      routePoints={routePoints}
      header={
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">保存済みルート</p>
            <h3 className="text-lg font-bold text-base-gray">
              {selectedRoute.title ?? "無題のルート"}
            </h3>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              clearSelectedRoute();
              clearRoutePoints();
            }}
          >
            一覧に戻る
          </Button>
        </div>
      }
      action={
        <p className="text-sm text-gray-500">
          閲覧モードです。次の段階で編集導線を追加します。
        </p>
      }
    />
  );
}

export default RouteDetailView;
