import { Pace } from "~/frontend/types/pace";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { metersToKilometers } from "~/frontend/lib/running";
import { useAuthPermission } from "~/frontend/features/auth/components/hooks/useAuthPermission";
import useGooglemapDirectionQuery from "~/frontend/hooks/googlemap/useGooglemapDirectionQuery";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import { Spinner } from "~/frontend/components/ui/spinner";
import PaceSelect from "~/frontend/features/pace/components/PaceSelect";
import RoutePointListItem from "~/frontend/features/route-points/components/RoutePointListItem";
import CreateRouteDialog from "~/frontend/features/route/components/CreateRouteDialog";
import { useUserQuery } from "~/frontend/features/user/hooks/useUserQuery";
import { RunCalculatedStats } from "./RunCalculatedStats";

interface RunDetailOverviewProps {
  routePoints: google.maps.LatLngLiteral[];
}

function RunDetailOverview({ routePoints }: RunDetailOverviewProps) {
  const { permissions } = useAuthPermission();
  const { data: session, status } = useSession();
  const { user } = useUserQuery({ enabled: status === "authenticated" });
  const { directions, isLoading } = useGooglemapDirectionQuery(routePoints, {
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
    return <div className="flex justify-center items-center"><Spinner className="size-6" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <p className="font-bold text-base-gray mb-2">ペース</p>
        <PaceSelect value={selectedPace} onChangeValue={setSelectedPace} className="w-full"/>
      </div> 
      <RunCalculatedStats
        pace={selectedPace}
        distanceKm={kilometers}
        weightKg={user?.weight}
      />
      {routePoints && (
        <ul>
          {routePoints.map((point, index) => (
            <li key={index} className="mb-2">
              <RoutePointListItem routePoint={point} index={index} onClick={(_) => moveStreetView(point)} />
            </li>
          ))}
        </ul>
      )}

      {session?.user && routePoints.length >= 2 && (
        <div className="text-center mt-5">
          <CreateRouteDialog routePoints={routePoints}  kilometers={kilometers} />
        </div>
      )}
    </div>
  )
}

export default RunDetailOverview