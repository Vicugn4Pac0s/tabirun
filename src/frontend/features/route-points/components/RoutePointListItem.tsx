import { Button } from "~/frontend/components/ui/button";

interface RoutePointListItemProps {
  index: number;
  onClick?: (index: number) => void;
}

/**
 * 地点番号を1始まりで表示し、選択時は0始まりの位置を通知する。
 */
function RoutePointListItem({ index, onClick }: RoutePointListItemProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-10 w-full px-2"
      aria-label={`地点${index + 1}に移動`}
      onClick={() => {
        onClick?.(index);
      }}
    >
      地点{index + 1}
    </Button>
  );
}

export default RoutePointListItem;
