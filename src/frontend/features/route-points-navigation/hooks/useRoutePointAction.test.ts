import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useRoutePointAction } from "~/frontend/features/route-points-navigation/hooks/useRoutePointAction";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";

const pointA = { lat: 35.0, lng: 139.0 };
const pointB = { lat: 35.1, lng: 139.1 };

afterEach(() => {
  cleanup();
  act(() => {
    useRoutePointsStore.getState().clearRoutePoints();
  });
});

describe("useRoutePointAction", () => {
  it("未登録ポイントでは add を返し、toggle で追加する", () => {
    const { result } = renderHook(() => useRoutePointAction(pointA));

    act(() => {
      useRoutePointsStore.getState().setRoutePoints([pointB]);
    });

    expect(result.current.type).toBe("add");

    act(() => {
      result.current.toggle();
    });

    expect(useRoutePointsStore.getState().routePoints).toEqual([pointB, pointA]);
  });

  it("登録済みポイントでは delete を返し、toggle で削除する", () => {
    const { result } = renderHook(() => useRoutePointAction(pointA));

    act(() => {
      useRoutePointsStore.getState().setRoutePoints([pointA, pointB]);
    });

    expect(result.current.type).toBe("delete");

    act(() => {
      result.current.toggle();
    });

    expect(useRoutePointsStore.getState().routePoints).toEqual([pointB]);
  });
});
