import type { TRPCClientErrorLike } from "@trpc/client";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Spinner } from "~/frontend/components/ui/spinner";
import { useAuthPermission } from "~/frontend/features/auth/components/hooks/useAuthPermission";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import PaceSelect from "~/frontend/features/pace/components/PaceSelect";
import RouteCreateAction from "~/frontend/features/route/components/RouteCreateAction";
import { useUserQuery } from "~/frontend/features/user/hooks/useUserQuery";
import useGooglemapDirectionQuery from "~/frontend/hooks/googlemap/useGooglemapDirectionQuery";
import { metersToKilometers } from "~/frontend/lib/running";
import type { Pace } from "~/frontend/types/pace";
import type { AppRouter } from "~/server/api/root";
import DirectionsWarningBanner from "./DirectionsWarningBanner";
import { RouteCalculatedStats } from "./RouteCalculatedStats";
import RoutePointList from "./RoutePointList";

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
  const { user } = useUserQuery({ enabled: isAuthenticated });
  const { directions, isLoading, error } = useGooglemapDirectionQuery(
    routePoints,
    {
      enabled: permissions.canUseDirections,
    },
  );
  const moveStreetView = useMoveStreetView();

  const [selectedPace, setSelectedPace] = useState<Pace>("5:00");

  useEffect(() => {
    if (user?.pace) {
      setSelectedPace(user.pace as Pace);
    }
  }, [user?.pace]);

  const kilometers = directions?.distanceMeters
    ? metersToKilometers(directions.distanceMeters)
    : 0;

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
        <DirectionsWarningBanner
          error={error as TRPCClientErrorLike<AppRouter>}
        />
      )}
      <div className="mb-6">
        <p className="mb-2 font-bold text-base-gray">ペース</p>
        <PaceSelect
          value={selectedPace}
          onChangeValue={setSelectedPace}
          className="w-full"
        />
      </div>
      <RouteCalculatedStats
        pace={selectedPace}
        distanceKm={kilometers}
        weightKg={user?.weight}
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
