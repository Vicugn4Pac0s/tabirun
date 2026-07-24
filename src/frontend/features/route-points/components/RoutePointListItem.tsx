import { MapPinned } from "lucide-react";
import { Button } from "~/frontend/components/ui/button";

interface RoutePointListItemProps {
  index: number;
  onClick?: (index: number) => void;
}

function RoutePointListItem({ index, onClick }: RoutePointListItemProps) {
  return (
    <div className="flex items-center justify-between rounded-md border border-base-gray-light px-2 py-1">
      <div className="inline-flex items-center gap-2">
        <MapPinned className="text-base-gray" />
        <span className="pt-1">地点{index + 1}</span>
      </div>
      <Button
        size={"sm"}
        variant={"outline"}
        onClick={() => {
          onClick?.(index);
        }}
      >
        移動
      </Button>
    </div>
  );
}

export default RoutePointListItem;
