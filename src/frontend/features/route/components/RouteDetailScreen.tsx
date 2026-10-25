"use client";

import Link from "next/link";
import RouteMenuButton from "~/frontend/features/route/components/RouteMenuButton";
import { getRouteMenuLabel } from "../lib/getRouteMenuLabel";
import type { RouterOutputs } from "~/trpc/react";
import { WarningBanner } from "~/frontend/components/app-ui/WarningBanner";
import { SidebarLayout } from "~/frontend/components/layout/SidebarLayout";
import { AuthUserMenu } from "~/frontend/features/auth/components/AuthUserMenu";
import RouteMapView from "~/frontend/features/googlemap/components/RouteMapView";
import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { useGoogleMapDirectionQuery } from "~/frontend/features/googlemap/api/useGoogleMapDirectionQuery";
import { getRoutePreviewMarkers } from "../lib/getRoutePreviewMarkers";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";

type RouteDetailScreenProps = {
  route: Pick<RouterOutputs["route"]["getById"], "id" | "title" | "points">;
};

function RouteDetailScreenContent({ route }: RouteDetailScreenProps) {
  const { directions, isLoading, error } = useGoogleMapDirectionQuery(
    route.points,
    { enabled: true },
  );
  const start = route.points[0];
  const goal = route.points[route.points.length - 1];
  const markers = getRoutePreviewMarkers(start, goal);
  return (
    <SidebarLayout
      sidebarTitle="ルート情報"
      mobileTrigger={
        <RouteMenuButton
          label={getRouteMenuLabel(directions?.distanceMeters, isLoading)}
          aria-label="ルート情報を開く"
        />
      }
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
          <Link
            href={`/routes/${route.id}/edit`}
            className="mb-4 inline-block rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            編集する
          </Link>
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
            <WarningBanner>
              経路を取得できませんでした。スタート・ゴールのみ表示しています。時間をおいて再度お試しください。
            </WarningBanner>
          ) : undefined
        }
      />
    </SidebarLayout>
  );
}

export function RouteDetailScreen(props: RouteDetailScreenProps) {
  return (
    <GoogleMapProvider>
      <RouteDetailScreenContent {...props} />
    </GoogleMapProvider>
  );
}
