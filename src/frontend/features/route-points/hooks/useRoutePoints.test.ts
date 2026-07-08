import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useRoutePoints } from "~/frontend/features/route-points/hooks/useRoutePoints";
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

describe("useRoutePoints", () => {
  it("ルートポイントが空なら全ての移動操作を無効にする", () => {
    const { result } = renderHook(() => useRoutePoints(pointA));

    expect(result.current.isInRoute).toBe(false);
    expect(result.current.activeIndex).toBeNull();
    expect(result.current.canPrev).toBe(false);
    expect(result.current.canNext).toBe(false);
    expect(result.current.firstRoutePoint).toBeNull();
    expect(result.current.lastRoutePoint).toBeNull();
  });

  it("先頭ポイントでは first/prev を無効にし、next/last を有効にする", () => {
    const { result } = renderHook(() => useRoutePoints(pointA));

    act(() => {
      useRoutePointsStore.getState().setRoutePoints([pointA, pointB, pointC]);
    });

    expect(result.current.isInRoute).toBe(true);
    expect(result.current.activeIndex).toBe(0);
    expect(result.current.isFirst).toBe(true);
    expect(result.current.isLast).toBe(false);
    expect(result.current.canPrev).toBe(false);
    expect(result.current.canNext).toBe(true);
    expect(result.current.nextRoutePoint).toEqual(pointB);
    expect(result.current.lastRoutePoint).toEqual(pointC);
  });

  it("末尾ポイントでは next/last を無効にし、first/prev を有効にする", () => {
    const { result } = renderHook(() => useRoutePoints(pointC));

    act(() => {
      useRoutePointsStore.getState().setRoutePoints([pointA, pointB, pointC]);
    });

    expect(result.current.activeIndex).toBe(2);
    expect(result.current.isFirst).toBe(false);
    expect(result.current.isLast).toBe(true);
    expect(result.current.canPrev).toBe(true);
    expect(result.current.canNext).toBe(false);
    expect(result.current.prevRoutePoint).toEqual(pointB);
    expect(result.current.firstRoutePoint).toEqual(pointA);
  });

  it("未登録ポイントではルート内移動を無効にする", () => {
    const { result } = renderHook(() =>
      useRoutePoints({ lat: 36.0, lng: 140.0 }),
    );

    act(() => {
      useRoutePointsStore.getState().setRoutePoints([pointA, pointB]);
    });

    expect(result.current.isInRoute).toBe(false);
    expect(result.current.activeIndex).toBe(-1);
    expect(result.current.canPrev).toBe(false);
    expect(result.current.canNext).toBe(false);
    expect(result.current.firstIndex).toBeNull();
    expect(result.current.lastIndex).toBeNull();
  });
});
