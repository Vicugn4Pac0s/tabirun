"use client";

import Link from "next/link";
import { MapWorkspaceLayout } from "~/frontend/features/googlemap/components/MapWorkspaceLayout";
import RouteMapView from "~/frontend/features/googlemap/components/RouteMapView";
import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import useGooglemapDirectionQuery from "~/frontend/hooks/googlemap/useGooglemapDirectionQuery";
import RoutePointList from "~/frontend/features/run-detail/components/RoutePointList";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";

type RouteDetailWorkspaceProps = {
  route: { title: string | null; points: google.maps.LatLngLiteral[] };
};

function RouteDetailContent({ route }: RouteDetailWorkspaceProps) {
  const { directions, isLoading, error } = useGooglemapDirectionQuery(
    route.points,
    { enabled: true },
  );
  const moveStreetView = useMoveStreetView();
  return (
    <MapWorkspaceLayout
      sidebar={
        <>
          <Link href="/" className="mb-5 inline-block font-medium underline">
            ホームへ戻る
          </Link>
          <p className="text-sm text-gray-500">保存済みルート</p>
          <h1 className="mb-4 mt-2 break-words text-xl font-bold">
            {route.title?.trim() ? route.title : "無題のルート"}
          </h1>
          <p className="mb-6 text-sm text-gray-600">
            地図や経由地点を選んで、Street Viewで下見できます。
          </p>
          <h2 className="mb-3 font-bold">
            経由地点（{route.points.length} 地点）
          </h2>
          <RoutePointList
            routePoints={route.points}
            onRoutePointClick={(point) => {
              void moveStreetView(point);
            }}
          />
        </>
      }
    >
      <RouteMapView
        initialCenter={route.points[0] ?? GOOGLE_MAP_DEFAULT_CENTER}
        routePoints={route.points}
        polylinePath={directions?.path.length ? directions.path : null}
        isDirectionLoading={isLoading}
        fitToRoute
        notice={
          error ? (
            <p
              role="alert"
              className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
            >
              経路を取得できませんでした。経由地点のみ表示しています。時間をおいて再度お試しください。
            </p>
          ) : undefined
        }
      />
    </MapWorkspaceLayout>
  );
}

export function RouteDetailWorkspace(props: RouteDetailWorkspaceProps) {
  return (
    <GoogleMapProvider>
      <RouteDetailContent {...props} />
    </GoogleMapProvider>
  );
}
