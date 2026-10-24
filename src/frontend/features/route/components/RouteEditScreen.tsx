"use client";

import Link from "next/link";
import type { RouterOutputs } from "~/trpc/react";
import { Input } from "~/frontend/components/ui/input";
import { WarningBanner } from "~/frontend/components/app-ui/WarningBanner";
import { SidebarLayout } from "~/frontend/components/layout/SidebarLayout";
import { AuthUserMenu } from "~/frontend/features/auth/components/AuthUserMenu";
import RouteMapView from "~/frontend/features/googlemap/components/RouteMapView";
import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import RoutePointList from "~/frontend/features/run-detail/components/RoutePointList";
import useGooglemapDirectionQuery from "~/frontend/hooks/googlemap/useGooglemapDirectionQuery";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { useRouteDraft } from "../hooks/useRouteDraft";

type EditableRoute = Pick<
  RouterOutputs["route"]["getById"],
  "id" | "title" | "points"
>;

type RouteEditScreenProps = {
  route: EditableRoute;
};

function RouteEditScreenContent({ route }: RouteEditScreenProps) {
  const { title, setTitle, points } = useRouteDraft(route);
  const { directions, isLoading, error } = useGooglemapDirectionQuery(points, {
    enabled: true,
  });
  const moveStreetView = useMoveStreetView();

  return (
    <SidebarLayout
      sidebarTitle="ルート編集"
      topRight={<AuthUserMenu />}
      sidebar={
        <>
          <Link
            href={`/routes/${route.id}`}
            className="mb-5 inline-block font-medium underline"
          >
            ルートに戻る
          </Link>
          <h1 className="mb-4 text-xl font-bold">ルートを編集</h1>
          <label className="block text-sm font-medium">
            <span className="mb-2 block">ルート名</span>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <p className="mb-6 mt-2 text-sm text-gray-500">
            入力内容はまだ保存できません。
          </p>
          <h2 className="mb-3 font-bold">経由地点（{points.length} 地点）</h2>
          <RoutePointList
            routePoints={points}
            onRoutePointClick={(point) => {
              void moveStreetView(point);
            }}
          />
        </>
      }
    >
      <RouteMapView
        showStreetView
        initialCenter={points[0] ?? GOOGLE_MAP_DEFAULT_CENTER}
        path={directions?.path.length ? directions.path : null}
        markers={points.map((point, index) => ({
          id: String(index),
          position: point,
          label: String(index + 1),
          title: `地点 ${index + 1}`,
        }))}
        isLoading={isLoading}
        fitToRoute
        notice={
          error ? (
            <WarningBanner>
              経路を取得できませんでした。経由地点のみ表示しています。時間をおいて再度お試しください。
            </WarningBanner>
          ) : undefined
        }
      />
    </SidebarLayout>
  );
}

export function RouteEditScreen(props: RouteEditScreenProps) {
  return (
    <GoogleMapProvider>
      <RouteEditScreenContent {...props} />
    </GoogleMapProvider>
  );
}
