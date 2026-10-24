"use client";

import Link from "next/link";
import RouteMenuButton from "~/frontend/features/route/components/RouteMenuButton";
import { getRouteMenuLabel } from "../lib/getRouteMenuLabel";
import { Input } from "~/frontend/components/ui/input";
import { SidebarLayout } from "~/frontend/components/layout/SidebarLayout";
import { AuthUserMenu } from "~/frontend/features/auth/components/AuthUserMenu";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import RoutePointList from "~/frontend/features/run-detail/components/RoutePointList";
import useGooglemapDirectionQuery from "~/frontend/hooks/googlemap/useGooglemapDirectionQuery";
import { Button } from "~/frontend/components/ui/button";

import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import RouteMapView from "~/frontend/features/googlemap/components/RouteMapView";
import { RouteNavigation } from "~/frontend/features/route-points-navigation/components/RouteNavigation";
import { WarningBanner } from "~/frontend/components/app-ui/WarningBanner";
import { useRouteCreation } from "../hooks/useRouteCreation";

type RouteCreateScreenProps = { defaultCenter: google.maps.LatLngLiteral };

function RouteCreateScreenContent({ defaultCenter }: RouteCreateScreenProps) {
  const {
    title,
    points,
    setTitle,
    togglePoint,
    isDirty,
    canSave,
    isCreating,
    save,
    reset,
    confirmDiscard,
  } = useRouteCreation();
  const { directions, isLoading, error } = useGooglemapDirectionQuery(points, {
    enabled: true,
  });
  const moveStreetView = useMoveStreetView();
  return (
    <SidebarLayout
      sidebarTitle="ルート作成"
      mobileTrigger={
        <RouteMenuButton
          label={getRouteMenuLabel(directions?.distanceMeters, isLoading)}
          aria-label="ルート作成を開く"
        />
      }
      topRight={<AuthUserMenu />}
      sidebar={
        <>
          <Link
            href="/"
            className="mb-5 inline-block font-medium underline"
            onClick={(event) => {
              if (isCreating || !confirmDiscard()) event.preventDefault();
            }}
            aria-disabled={isCreating}
          >
            ホームへ戻る
          </Link>
          <h1 className="mb-4 text-xl font-bold">ルートを作成</h1>
          <label className="block text-sm font-medium">
            <span className="mb-2 block">ルート名</span>
            <Input
              disabled={isCreating}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <p className="mt-2 text-sm text-gray-500">
            Street View下部のボタンで地点を追加・削除できます。
          </p>
          <div className="my-6 flex gap-2">
            <Button
              type="button"
              disabled={!canSave || isCreating}
              onClick={() => {
                void save();
              }}
            >
              {isCreating ? "保存中..." : "ルートを保存する"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty || isCreating}
              onClick={reset}
            >
              リセット
            </Button>
          </div>
          {points.length < 2 && (
            <p role="status" className="mb-3 text-sm text-gray-500">
              保存するには2地点以上を登録してください。
            </p>
          )}
          <h2 className="mb-3 font-bold">経由地点（{points.length} 地点）</h2>
          <RoutePointList
            routePoints={points}
            onRoutePointClick={(point) => {
              void moveStreetView(point).catch(() => undefined);
            }}
          />
        </>
      }
    >
      <RouteMapView
        showStreetView
        initialCenter={defaultCenter}
        path={directions?.path.length ? directions.path : null}
        markers={points.map((point, index) => ({
          id: String(index),
          position: point,
          label: String(index + 1),
          title: `地点 ${index + 1}`,
        }))}
        isLoading={isLoading}
        renderNavigation={(point) => (
          <RouteNavigation
            points={points}
            currentPoint={point}
            onMove={(target) => {
              void moveStreetView(target).catch(() => undefined);
            }}
            onToggle={() => togglePoint(point)}
            disabled={isCreating}
          />
        )}
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

export function RouteCreateScreen(props: RouteCreateScreenProps) {
  return (
    <GoogleMapProvider>
      <RouteCreateScreenContent {...props} />
    </GoogleMapProvider>
  );
}
