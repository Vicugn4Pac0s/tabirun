import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSelectedRouteStore } from "~/frontend/features/route/stores/selectedRouteStore";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import { useDashboardNavigation } from "./useDashboardNavigation";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const route = { id: 1, title: "朝のルート", points: [{ lat: 35, lng: 135 }] };
beforeEach(() => {
  vi.clearAllMocks();
  useSelectedRouteStore.getState().clearSelectedRoute();
  useRoutePointsStore.getState().clearRoutePoints();
});
describe("useDashboardNavigation", () => {
  it("新規作成では以前の選択と編集地点をクリアする", () => {
    useSelectedRouteStore.getState().selectRoute(route);
    useRoutePointsStore.getState().setRoutePoints(route.points);
    const { result } = renderHook(() => useDashboardNavigation());
    act(() => result.current.createRoute());
    expect(useSelectedRouteStore.getState().selectedRoute).toBeNull();
    expect(useRoutePointsStore.getState().routePoints).toEqual([]);
    expect(push).toHaveBeenCalledWith("/map");
  });
});
