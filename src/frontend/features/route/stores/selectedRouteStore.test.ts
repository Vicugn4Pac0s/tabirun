import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup } from "@testing-library/react";
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
    useSelectedRouteStore.getState().clearSelectedRoute();
  });
});

describe("useSelectedRouteStore", () => {
  it("ルート選択時に selectedRoute と draftTitle を初期化する", () => {
    useSelectedRouteStore.getState().selectRoute(selectedRoute);

    const state = useSelectedRouteStore.getState();
    expect(state.selectedRoute).toEqual(selectedRoute);
    expect(state.mode).toBe("view");
    expect(state.draftTitle).toBe("Morning Run");
  });

  it("mode を変更できる", () => {
    useSelectedRouteStore.getState().setMode("edit");

    expect(useSelectedRouteStore.getState().mode).toBe("edit");
  });

  it("draftTitle を変更できる", () => {
    useSelectedRouteStore.getState().setDraftTitle("Evening Run");

    expect(useSelectedRouteStore.getState().draftTitle).toBe("Evening Run");
  });

  it("選択状態をクリアできる", () => {
    useSelectedRouteStore.getState().selectRoute(selectedRoute);
    useSelectedRouteStore.getState().setMode("edit");
    useSelectedRouteStore.getState().setDraftTitle("Changed");

    useSelectedRouteStore.getState().clearSelectedRoute();

    const state = useSelectedRouteStore.getState();
    expect(state.selectedRoute).toBeNull();
    expect(state.mode).toBe("view");
    expect(state.draftTitle).toBe("");
  });
});
