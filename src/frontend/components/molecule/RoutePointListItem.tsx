import { MapPinned } from "lucide-react";
import { Button } from "../ui/button";

interface RoutePointListItemProps {
  routePoint: google.maps.LatLngLiteral;
  index: number;
  onClick?: (index: number) => void;
}

function RoutePointListItem({ routePoint, index, onClick }: RoutePointListItemProps) {

  return (
    <div className="border-base-gray-light border rounded-md px-2 py-1 flex justify-between items-center">
      <div className="inline-flex items-center gap-2">
        <MapPinned className="text-base-gray" /><span className="pt-1">地点{index + 1}</span>
      </div>
      <Button size={"sm"} variant={"outline"} onClick={()=>{
        onClick?.(index);
      }}>移動</Button>
    </div>
  )
}

export default RoutePointListItem