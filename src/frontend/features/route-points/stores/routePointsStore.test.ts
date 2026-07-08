import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup } from "@testing-library/react";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";

const pointA = { lat: 35.0, lng: 139.0 };
const pointB = { lat: 35.1, lng: 139.1 };
const pointC = { lat: 35.2, lng: 139.2 };

afterEach(() => {
  cleanup();
  act(() => {
    useRoutePointsStore.getState().clearRoutePoints();
  });
});

describe("useRoutePointsStore", () => {
  it("ルートポイントを一括設定できる", () => {
    useRoutePointsStore.getState().setRoutePoints([pointA, pointB]);

    expect(useRoutePointsStore.getState().routePoints).toEqual([pointA, pointB]);
  });

  it("ルートポイントを末尾に追加できる", () => {
    useRoutePointsStore.getState().setRoutePoints([pointA]);

    useRoutePointsStore.getState().addRoutePoint(pointB);

    expect(useRoutePointsStore.getState().routePoints).toEqual([pointA, pointB]);
  });

  it("指定 index のルートポイントを削除できる", () => {
    useRoutePointsStore.getState().setRoutePoints([pointA, pointB, pointC]);

    useRoutePointsStore.getState().removeRoutePoint(1);

    expect(useRoutePointsStore.getState().routePoints).toEqual([pointA, pointC]);
  });

  it("指定した座標のルートポイントを削除できる", () => {
    useRoutePointsStore.getState().setRoutePoints([pointA, pointB, pointC]);

    useRoutePointsStore.getState().removeRoutePointByLatLng(pointB);

    expect(useRoutePointsStore.getState().routePoints).toEqual([pointA, pointC]);
  });

  it("ルートポイントを全削除できる", () => {
    useRoutePointsStore.getState().setRoutePoints([pointA, pointB]);

    useRoutePointsStore.getState().clearRoutePoints();

    expect(useRoutePointsStore.getState().routePoints).toEqual([]);
  });
});
