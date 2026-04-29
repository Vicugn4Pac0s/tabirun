"use client";

import { Button } from "~/frontend/components/ui/button";
import { Input } from "~/frontend/components/ui/input";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import RunDetailOverview from "~/frontend/features/run-detail/components/RunDetailOverview";
import { useSelectedRouteStore } from "../stores/selectedRouteStore";

function RouteDetailView() {
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const clearRoutePoints = useRoutePointsStore((state) => state.clearRoutePoints);
  const setRoutePoints = useRoutePointsStore((state) => state.setRoutePoints);
  const selectedRoute = useSelectedRouteStore((state) => state.selectedRoute);
  const mode = useSelectedRouteStore((state) => state.mode);
  const draftTitle = useSelectedRouteStore((state) => state.draftTitle);
  const setDraftTitle = useSelectedRouteStore((state) => state.setDraftTitle);
  const setMode = useSelectedRouteStore((state) => state.setMode);
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
            {mode === "edit" ? (
              <Input
                value={draftTitle}
                onChange={(e) => {
                  setDraftTitle(e.target.value);
                }}
                placeholder="ルート名を入力"
                className="mt-1 max-w-64"
              />
            ) : (
              <h3 className="text-lg font-bold text-base-gray">
                {selectedRoute.title ?? "無題のルート"}
              </h3>
            )}
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
        mode === "view" ? (
          <Button
            type="button"
            onClick={() => {
              setMode("edit");
            }}
          >
            編集する
          </Button>
        ) : (
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMode("view");
                setDraftTitle(selectedRoute.title ?? "");
                setRoutePoints(selectedRoute.points);
              }}
            >
              編集をやめる
            </Button>
            <p className="self-center text-sm text-gray-500">
              更新導線は次の段階で追加します。
            </p>
          </div>
        )
      }
    />
  );
}

export default RouteDetailView;
