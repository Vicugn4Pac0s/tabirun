"use client";

import { Button } from "~/frontend/components/ui/button";
import { Input } from "~/frontend/components/ui/input";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import RunDetailOverview from "~/frontend/features/run-detail/components/RunDetailOverview";
import { useRouteEditorState } from "../hooks/useRouteEditorState";
import { useSelectedRouteStore } from "../stores/selectedRouteStore";

function RouteDetailView() {
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const clearRoutePoints = useRoutePointsStore((state) => state.clearRoutePoints);
  const setRoutePoints = useRoutePointsStore((state) => state.setRoutePoints);
  const { selectedRoute, mode, draftTitle, isDirty } = useRouteEditorState();
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
            <span
              className={`self-center text-sm ${
                isDirty ? "text-amber-600" : "text-gray-500"
              }`}
            >
              {isDirty ? "未保存の変更があります" : "変更はありません"}
            </span>
          </div>
        )
      }
    />
  );
}

export default RouteDetailView;
