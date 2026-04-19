import { Pace } from "~/frontend/types/pace";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { calcCaloriesFromRun, calcTimeFromDistanceAndPace, metersToKilometers } from "~/frontend/lib/running";
import { useAuthPermission } from "~/frontend/features/auth/components/hooks/useAuthPermission";
import useGooglemapDirectionQuery from "~/frontend/hooks/googlemap/useGooglemapDirectionQuery";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import { Spinner } from "~/frontend/components/ui/spinner";
import { StatValue } from "~/frontend/components/app-ui/StatValue";
import PaceSelect from "~/frontend/features/pace/components/PaceSelect";
import RoutePointListItem from "~/frontend/features/route-points/components/RoutePointListItem";
import CreateRouteDialog from "~/frontend/features/route/components/CreateRouteDialog";

interface RunDetailOverviewProps {
  routePoints: google.maps.LatLngLiteral[];
}

function RunDetailOverview({ routePoints }: RunDetailOverviewProps) {
  const { permissions } = useAuthPermission();
  const { directions, isLoading, error } = useGooglemapDirectionQuery(routePoints, {
    enabled: permissions.canUseDirections,
  });
  const moveStreetView = useMoveStreetView();

  const [selectedPace, setSelectedPace] = useState<Pace>("5:00");

  const kilometers = directions?.distanceMeters ? metersToKilometers(directions.distanceMeters) : 0;
  const time =  kilometers && calcTimeFromDistanceAndPace(kilometers, selectedPace)
  const calories =  calcCaloriesFromRun(60, kilometers, selectedPace);

  const {data: session} = useSession();
  
  if (isLoading) {
    return <div className="flex justify-center items-center"><Spinner className="size-6" /></div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <p className="font-bold text-base-gray mb-2">ペース</p>
        <PaceSelect value={selectedPace} onChangeValue={setSelectedPace} className="w-full"/>
      </div> 
      {kilometers ? (
        <ul className="grid grid-cols-2 gap-2 text-center mb-6">
          <li>
            <StatValue value={kilometers} unit="KM" className="text-base-gray text-2xl" />
          </li>
          <li>
            <StatValue value={time} className="text-base-gray text-2xl" />
          </li>
          <li>
            <StatValue value={calories} unit="KCAL" className="text-base-gray text-2xl" />
          </li>
        </ul>
      ) : null}
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