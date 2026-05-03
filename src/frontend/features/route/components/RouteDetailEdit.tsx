"use client";

import { Button } from "~/frontend/components/ui/button";
import { Input } from "~/frontend/components/ui/input";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import RunDetailOverview from "~/frontend/features/run-detail/components/RunDetailOverview";
import { toast } from "sonner";
import { useRouteDiscardGuard } from "../hooks/useRouteDiscardGuard";
import { useRouteEditorState } from "../hooks/useRouteEditorState";
import { useUpdateRoute } from "../hooks/useUpdateRoute";
import type { SelectedRoute } from "../stores/selectedRouteStore";
import { useSelectedRouteStore } from "../stores/selectedRouteStore";
import RouteDetailHeader from "./RouteDetailHeader";

interface RouteDetailEditProps {
  selectedRoute: SelectedRoute;
}

function RouteDetailEdit({ selectedRoute }: RouteDetailEditProps) {
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const clearRoutePoints = useRoutePointsStore((state) => state.clearRoutePoints);
  const setRoutePoints = useRoutePointsStore((state) => state.setRoutePoints);
  const { draftTitle, trimmedDraftTitle, isDirty, canUpdate } =
    useRouteEditorState();
  const setDraftTitle = useSelectedRouteStore((state) => state.setDraftTitle);
  const setMode = useSelectedRouteStore((state) => state.setMode);
  const clearSelectedRoute = useSelectedRouteStore(
    (state) => state.clearSelectedRoute,
  );
  const selectRoute = useSelectedRouteStore((state) => state.selectRoute);
  const { updateRoute, isUpdating } = useUpdateRoute();
  const { confirmDiscard } = useRouteDiscardGuard();
  const handleBack = () => {
    if (!confirmDiscard()) {
      return;
    }

    clearSelectedRoute();
    clearRoutePoints();
  };

  return (
    <RunDetailOverview
      routePoints={routePoints}
      header={
        <RouteDetailHeader
          onBack={handleBack}
          titleContent={
            <Input
              value={draftTitle}
              onChange={(e) => {
                setDraftTitle(e.target.value);
              }}
              placeholder="ルート名を入力"
              className="mt-1 max-w-64"
            />
          }
        />
      }
      action={
        <div className="flex flex-col items-center gap-2">
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
              disabled={!canUpdate || isUpdating}
            >
              {isUpdating ? "更新中..." : "更新する"}
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (typeof window !== "undefined") {
                const confirmed = window.confirm(
                  "編集中の変更を破棄してリセットしますか？",
                );
                if (!confirmed) {
                  return;
                }
              }

              setDraftTitle(selectedRoute.title ?? "");
              setRoutePoints(selectedRoute.points);
            }}
            disabled={!isDirty || isUpdating}
          >
            リセット
          </Button>
        </div>
      }
    />
  );
}

export default RouteDetailEdit;
