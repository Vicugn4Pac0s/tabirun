"use client";

import Link from "next/link";
import { SidebarLayout } from "~/frontend/components/layout/SidebarLayout";
import { AuthUserMenu } from "~/frontend/features/auth/components/AuthUserMenu";
import RouteMapView from "~/frontend/features/googlemap/components/RouteMapView";
import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import useGooglemapDirectionQuery from "~/frontend/hooks/googlemap/useGooglemapDirectionQuery";
import { getRoutePreviewMarkers } from "../lib/getRoutePreviewMarkers";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";

type RouteDetailWorkspaceProps = {
  route: { title: string | null; points: google.maps.LatLngLiteral[] };
};

function RouteDetailContent({ route }: RouteDetailWorkspaceProps) {
  const { directions, isLoading, error } = useGooglemapDirectionQuery(
    route.points,
    { enabled: true },
  );
  const start = route.points[0];
  const goal = route.points[route.points.length - 1];
  const markers = getRoutePreviewMarkers(start, goal);
  return (
    <SidebarLayout
      sidebarTitle="ルート情報"
      topRight={<AuthUserMenu />}
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
            地図上の位置を選んで、Street Viewで下見できます。
          </p>
        </>
      }
    >
      <RouteMapView
        showStreetView
        initialCenter={route.points[0] ?? GOOGLE_MAP_DEFAULT_CENTER}
        path={directions?.path.length ? directions.path : null}
        markers={markers}
        isLoading={isLoading}
        fitToRoute
        notice={
          error ? (
            <p
              role="alert"
              className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
            >
              経路を取得できませんでした。スタート・ゴールのみ表示しています。時間をおいて再度お試しください。
            </p>
          ) : undefined
        }
      />
    </SidebarLayout>
  );
}

export function RouteDetailWorkspace(props: RouteDetailWorkspaceProps) {
  return (
    <GoogleMapProvider>
      <RouteDetailContent {...props} />
    </GoogleMapProvider>
  );
}
