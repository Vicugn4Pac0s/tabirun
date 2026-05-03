"use client";

import { Button } from "~/frontend/components/ui/button";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import RunDetailOverview from "~/frontend/features/run-detail/components/RunDetailOverview";
import { toast } from "sonner";
import { useDeleteRoute } from "../hooks/useDeleteRoute";
import { useRouteDiscardGuard } from "../hooks/useRouteDiscardGuard";
import type { SelectedRoute } from "../stores/selectedRouteStore";
import { useSelectedRouteStore } from "../stores/selectedRouteStore";
import RouteDetailHeader from "./RouteDetailHeader";

interface RouteDetailReadonlyProps {
  selectedRoute: SelectedRoute;
}

function RouteDetailReadonly({
  selectedRoute,
}: RouteDetailReadonlyProps) {
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const clearRoutePoints = useRoutePointsStore((state) => state.clearRoutePoints);
  const clearSelectedRoute = useSelectedRouteStore(
    (state) => state.clearSelectedRoute,
  );
  const setMode = useSelectedRouteStore((state) => state.setMode);
  const { deleteRoute, isDeleting } = useDeleteRoute();
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
            <h3 className="text-lg font-bold text-base-gray">
              {selectedRoute.title ?? "無題のルート"}
            </h3>
          }
        />
      }
      action={
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
      }
    />
  );
}

export default RouteDetailReadonly;
