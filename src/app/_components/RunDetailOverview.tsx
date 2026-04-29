import type { Pace } from "~/frontend/types/pace";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { metersToKilometers } from "~/frontend/lib/running";
import { useAuthPermission } from "~/frontend/features/auth/components/hooks/useAuthPermission";
import useGooglemapDirectionQuery from "~/frontend/hooks/googlemap/useGooglemapDirectionQuery";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import { Spinner } from "~/frontend/components/ui/spinner";
import PaceSelect from "~/frontend/features/pace/components/PaceSelect";
import RouteCreateAction from "~/frontend/features/route/components/RouteCreateAction";
import DirectionsWarningBanner from "~/frontend/features/run-detail/components/DirectionsWarningBanner";
import { RouteCalculatedStats } from "~/frontend/features/run-detail/components/RouteCalculatedStats";
import RoutePointList from "~/frontend/features/run-detail/components/RoutePointList";
import { useUserQuery } from "~/frontend/features/user/hooks/useUserQuery";
import { type TRPCClientErrorLike } from "@trpc/client";
import { type AppRouter } from "~/server/api/root";

interface RunDetailOverviewProps {
  routePoints: google.maps.LatLngLiteral[];
}

function RunDetailOverview({ routePoints }: RunDetailOverviewProps) {
  const { permissions } = useAuthPermission();
  const { data: session, status } = useSession();
  const { user } = useUserQuery({ enabled: status === "authenticated" });
  const { directions, isLoading, error } = useGooglemapDirectionQuery(routePoints, {
    enabled: permissions.canUseDirections,
  });
  const moveStreetView = useMoveStreetView();

  const [selectedPace, setSelectedPace] = useState<Pace>("5:00");

  useEffect(() => {
    if (user?.pace) {
      setSelectedPace(user.pace as Pace);
    }
  }, [user?.pace]);

  const kilometers = directions?.distanceMeters ? metersToKilometers(directions.distanceMeters) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div>
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
        <RouteCreateAction
          isAuthenticated={Boolean(session?.user)}
          routePoints={routePoints}
          kilometers={kilometers}
        />
      </div>
    </div>
  );
}

export default RunDetailOverview;
