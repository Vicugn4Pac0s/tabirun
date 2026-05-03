import { Button } from "~/frontend/components/ui/button";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import CreateRouteDialog from "./CreateRouteDialog";

interface RouteCreateActionProps {
  isAuthenticated: boolean;
  routePoints: google.maps.LatLngLiteral[];
}

function RouteCreateAction({
  isAuthenticated,
  routePoints,
}: RouteCreateActionProps) {
  const clearRoutePoints = useRoutePointsStore((state) => state.clearRoutePoints);

  if (!isAuthenticated || routePoints.length < 2) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <CreateRouteDialog routePoints={routePoints} />
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          if (typeof window !== "undefined") {
            const confirmed = window.confirm(
              "作成中のルートを破棄してリセットしますか？",
            );
            if (!confirmed) {
              return;
            }
          }

          clearRoutePoints();
        }}
      >
        リセット
      </Button>
    </div>
  );
}

export default RouteCreateAction;
