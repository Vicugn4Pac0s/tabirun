import { useSession } from "next-auth/react";
import { calcCaloriesFromRun, calcTimeFromDistanceAndPace, metersToKilometers, Pace } from "~/shared/helpers/calc";
import { useState } from "react";
import { usePaces } from "~/frontend/hooks/api/usePace";
import useGooglemapDirection from "~/frontend/hooks/api/useGooglemapDirection";
import useStreetViewPanorama from "~/frontend/hooks/googlemap/useStreetViewPanorama";
import { Selectbox } from "../atoms/Selectbox";
import { StatValue } from "../atoms/StatValue";
import RoutePointListItem from "../molecule/RoutePointListItem";
import { Spinner } from "../ui/spinner";
import RegisterRouteDialog from "./RegisterRouteDialog";


interface RunDetailOverviewProps {
  routePoints: google.maps.LatLngLiteral[];
}

function RunDetailOverview({ routePoints }: RunDetailOverviewProps) {
  const { directions, isLoading, error } = useGooglemapDirection(routePoints);
  const { moveStreetViewPanorama } = useStreetViewPanorama();

  const { paces } = usePaces();

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

  const paceOptions = paces?.map((pace) => ({ value: pace.value, label: pace.value })) || [];

  return (
    <div>
      <div className="mb-6">
        <p className="font-bold text-base-gray mb-2">ペース</p>
        <Selectbox items={paceOptions} value={selectedPace} onValueChange={(value) => setSelectedPace(value as Pace)} className="w-full"/>
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
              <RoutePointListItem routePoint={point} index={index} onClick={(_) => moveStreetViewPanorama(point)} />
            </li>
          ))}
        </ul>
      )}

      {session?.user && routePoints.length >= 2 && (
        <div className="text-center mt-5">
          <RegisterRouteDialog routePoints={routePoints}  kilometers={kilometers} />
        </div>
      )}
    </div>
  )
}

export default RunDetailOverview