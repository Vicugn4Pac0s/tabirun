import RoutePointListItem from "./RoutePointListItem";

interface RoutePointListProps {
  routePoints: google.maps.LatLngLiteral[];
  onRoutePointClick?: (point: google.maps.LatLngLiteral, index: number) => void;
}

/**
 * 経由地点を登録順に並べ、選択した座標と0始まりの位置を呼出側へ通知する。
 * 地点がない場合は件数だけを表示する。
 */
function RoutePointList({
  routePoints,
  onRoutePointClick,
}: RoutePointListProps) {
  return (
    <>
      <p className="mb-3 font-bold">経由地点（{routePoints.length} 地点）</p>
      {routePoints.length > 0 && (
        <ul
          aria-label="経由地点"
          className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2"
        >
          {routePoints.map((point, index) => (
            <li key={index}>
              <RoutePointListItem
                index={index}
                onClick={() => {
                  onRoutePointClick?.(point, index);
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default RoutePointList;
