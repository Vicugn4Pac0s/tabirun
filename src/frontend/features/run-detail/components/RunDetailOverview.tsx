import type { TRPCClientErrorLike } from "@trpc/client";
import type { ReactNode } from "react";
import { Spinner } from "~/frontend/components/ui/spinner";
import { useAuthPermission } from "~/frontend/features/auth/components/hooks/useAuthPermission";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import RouteCreateAction from "~/frontend/features/route/components/RouteCreateAction";
import { useGoogleMapDirectionQuery } from "~/frontend/features/googlemap/api/useGoogleMapDirectionQuery";
import type { AppRouter } from "~/server/api/root";
import DirectionsWarningBanner from "./DirectionsWarningBanner";
import RoutePointList from "./RoutePointList";
import { RunMetricsPanel } from "~/frontend/features/run-metrics/components/RunMetricsPanel";
import { useRunEstimateInputs } from "~/frontend/features/run-metrics/hooks/useRunEstimateInputs";

interface RunDetailOverviewProps {
  routePoints: google.maps.LatLngLiteral[];
  header?: ReactNode;
  action?: ReactNode;
}

function RunDetailOverview({
  routePoints,
  header,
  action,
}: RunDetailOverviewProps) {
  const { isAuthenticated, permissions } = useAuthPermission();
  const { pace, setPace, weightKg } = useRunEstimateInputs(isAuthenticated);
  const { directions, isLoading, error } = useGoogleMapDirectionQuery(
    routePoints,
    {
      enabled: permissions.canUseDirections,
    },
  );
  const moveStreetView = useMoveStreetView();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div>
      {header ? <div className="mb-6">{header}</div> : null}
      {error && (
        <div className="mb-4">
          <DirectionsWarningBanner
            error={error as TRPCClientErrorLike<AppRouter>}
          />
        </div>
      )}
      <RunMetricsPanel
        distanceMeters={directions?.distanceMeters}
        isLoading={isLoading}
        pace={pace}
        onPaceChange={setPace}
        weightKg={weightKg}
      />
      <RoutePointList
        routePoints={routePoints}
        onRoutePointClick={(point) => {
          void moveStreetView(point);
        }}
      />
      <div className="mt-5 text-center">
        {action ?? (
          <RouteCreateAction
            isAuthenticated={isAuthenticated}
            routePoints={routePoints}
          />
        )}
      </div>
    </div>
  );
}

export default RunDetailOverview;
