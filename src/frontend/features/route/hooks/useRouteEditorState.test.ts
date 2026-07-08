import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import { useRouteEditorState } from "~/frontend/features/route/hooks/useRouteEditorState";
import { useSelectedRouteStore } from "~/frontend/features/route/stores/selectedRouteStore";

const selectedRoute = {
  id: 1,
  title: "Morning Run",
  points: [
    { lat: 35.0, lng: 139.0 },
    { lat: 35.1, lng: 139.1 },
  ],
};

afterEach(() => {
  cleanup();
  act(() => {
    useRoutePointsStore.getState().clearRoutePoints();
    useSelectedRouteStore.getState().clearSelectedRoute();
  });
});

describe("useRouteEditorState", () => {
  it("未選択時は保存済みルート表示ではなく、ルートポイント編集を許可する", () => {
    const { result } = renderHook(() => useRouteEditorState());

    expect(result.current.selectedRoute).toBeNull();
    expect(result.current.isViewingSavedRoute).toBe(false);
    expect(result.current.canEditRoutePoints).toBe(true);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.canUpdate).toBe(false);
  });

  it("選択済みルートと同一内容なら dirty ではない", () => {
    const { result } = renderHook(() => useRouteEditorState());

    act(() => {
      useSelectedRouteStore.getState().selectRoute(selectedRoute);
      useRoutePointsStore.getState().setRoutePoints(selectedRoute.points);
    });

    expect(result.current.isDirty).toBe(false);
    expect(result.current.canUpdate).toBe(false);
    expect(result.current.canEditRoutePoints).toBe(false);
  });

  it("edit モードでタイトル変更があり、条件を満たせば更新可能になる", () => {
    const { result } = renderHook(() => useRouteEditorState());

    act(() => {
      useSelectedRouteStore.getState().selectRoute(selectedRoute);
      useSelectedRouteStore.getState().setMode("edit");
      useSelectedRouteStore.getState().setDraftTitle("Updated Run");
      useRoutePointsStore.getState().setRoutePoints(selectedRoute.points);
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.trimmedDraftTitle).toBe("Updated Run");
    expect(result.current.canUpdate).toBe(true);
    expect(result.current.canEditRoutePoints).toBe(true);
  });

  it("空白だけのタイトルでは更新不可になる", () => {
    const { result } = renderHook(() => useRouteEditorState());

    act(() => {
      useSelectedRouteStore.getState().selectRoute(selectedRoute);
      useSelectedRouteStore.getState().setMode("edit");
      useSelectedRouteStore.getState().setDraftTitle("   ");
      useRoutePointsStore.getState().setRoutePoints([
        selectedRoute.points[0]!,
        { lat: 35.2, lng: 139.2 },
      ]);
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.trimmedDraftTitle).toBe("");
    expect(result.current.canUpdate).toBe(false);
  });
});
