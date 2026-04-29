"use client";

import { Spinner } from "~/frontend/components/ui/spinner";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import { useRoutesQuery } from "../hooks/useRoutesQuery";
import { useSelectedRouteStore } from "../stores/selectedRouteStore";

function RouteList() {
  const { routes, isLoading, error } = useRoutesQuery();
  const setRoutePoints = useRoutePointsStore((state) => state.setRoutePoints);
  const selectRoute = useSelectedRouteStore((state) => state.selectRoute);
  const moveStreetView = useMoveStreetView();

  if (isLoading) {
    return <div className="flex justify-center items-center"><Spinner className="size-6" /></div>;
  }

  if (error) {
    return <p className="text-center text-red-500">エラーが発生しました: {error.message}</p>;
  }

  if(!routes || routes.length === 0) {
    return <p className="text-center text-base-gray">地図をクリックしてルートを作成してください</p>;
  }

  return (
    routes && (
      <ul className="space-y-4">
        {routes.map((route) => {
          const routePoints = route.points as google.maps.LatLngLiteral[];
          const firstPoint = routePoints[0];

          return (
            <li key={route.id}>
              <button
                type="button"
                className="w-full rounded border p-4 text-left transition-colors hover:bg-gray-50"
                onClick={() => {
                  selectRoute({
                    id: route.id,
                    title: route.title,
                    points: routePoints,
                    kilometers: route.kilometers,
                  });
                  setRoutePoints(routePoints);
                  if (firstPoint) {
                    void moveStreetView(firstPoint);
                  }
                }}
              >
                <h3 className="text-lg font-bold">{route.title}</h3>
                <p className="text-sm text-gray-500">{route.kilometers.toFixed(2)} KM</p>
              </button>
            </li>
          );
        })}
      </ul>
    )
  );
}

export default RouteList
