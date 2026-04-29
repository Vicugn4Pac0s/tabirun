"use client";

import { Button } from "~/frontend/components/ui/button";
import { Input } from "~/frontend/components/ui/input";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import RunDetailOverview from "~/frontend/features/run-detail/components/RunDetailOverview";
import { toast } from "sonner";
import { useDeleteRoute } from "../hooks/useDeleteRoute";
import { useRouteDiscardGuard } from "../hooks/useRouteDiscardGuard";
import { useRouteEditorState } from "../hooks/useRouteEditorState";
import { useUpdateRoute } from "../hooks/useUpdateRoute";
import { useSelectedRouteStore } from "../stores/selectedRouteStore";

function RouteDetailView() {
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const clearRoutePoints = useRoutePointsStore((state) => state.clearRoutePoints);
  const setRoutePoints = useRoutePointsStore((state) => state.setRoutePoints);
  const {
    selectedRoute,
    mode,
    draftTitle,
    trimmedDraftTitle,
    canUpdate,
  } =
    useRouteEditorState();
  const setDraftTitle = useSelectedRouteStore((state) => state.setDraftTitle);
  const setMode = useSelectedRouteStore((state) => state.setMode);
  const clearSelectedRoute = useSelectedRouteStore(
    (state) => state.clearSelectedRoute,
  );
  const selectRoute = useSelectedRouteStore((state) => state.selectRoute);
  const { updateRoute, isUpdating } = useUpdateRoute();
  const { deleteRoute, isDeleting } = useDeleteRoute();
  const { confirmDiscard } = useRouteDiscardGuard();

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
              if (!confirmDiscard()) {
                return;
              }
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
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (typeof window !== "undefined") {
                  const confirmed = window.confirm("このルートを削除しますか？");
                  if (!confirmed) {
                    return;
                  }
                }

                void deleteRoute(
                  { id: selectedRoute.id },
                  {
                    onSuccess: () => {
                      clearSelectedRoute();
                      clearRoutePoints();
                      toast.success("ルートを削除しました。");
                    },
                    onError: () => {
                      toast.error(
                        "ルートを削除できませんでした。時間をおいて再度お試しください。",
                      );
                    },
                  },
                );
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "削除中..." : "削除する"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setMode("edit");
              }}
              disabled={isDeleting}
            >
              編集する
            </Button>
          </div>
        ) : (
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!confirmDiscard()) {
                  return;
                }
                setMode("view");
                setDraftTitle(selectedRoute.title ?? "");
                setRoutePoints(selectedRoute.points);
              }}
              disabled={isUpdating || isDeleting}
            >
              編集をやめる
            </Button>
            <Button
              type="button"
              onClick={() => {
                void updateRoute(
                  {
                    id: selectedRoute.id,
                    title: trimmedDraftTitle,
                    points: routePoints,
                  },
                  {
                    onSuccess: () => {
                      selectRoute({
                        ...selectedRoute,
                        title: trimmedDraftTitle,
                        points: routePoints,
                      });
                      setMode("view");
                      toast.success("ルートを更新しました。");
                    },
                    onError: () => {
                      toast.error(
                        "ルートを更新できませんでした。時間をおいて再度お試しください。",
                      );
                    },
                  },
                );
              }}
              disabled={!canUpdate || isUpdating || isDeleting}
            >
              {isUpdating ? "更新中..." : "更新する"}
            </Button>
          </div>
        )
      }
    />
  );
}

export default RouteDetailView;
