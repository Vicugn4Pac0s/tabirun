import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoogleMapProvider } from "../providers/GoogleMapProvider";
import RouteMapView from "./RouteMapView";
import type { RouteMapMarker } from "../types";

const { moveStreetView, focusMapOnRoute } = vi.hoisted(() => ({
  moveStreetView: vi.fn(),
  focusMapOnRoute: vi.fn(),
}));
vi.mock("../hooks/useMoveStreetView", () => ({
  useMoveStreetView: () => moveStreetView,
}));
vi.mock("../hooks/useFocusMapOnRoute", () => ({
  useFocusMapOnRoute: () => ({ focusMapOnRoute }),
}));
vi.mock("./GoogleMapView", () => ({
  default: ({
    children,
    isLoading,
  }: {
    children: React.ReactNode;
    isLoading: boolean;
  }) => (
    <div>
      {isLoading && <p role="status">読み込み中</p>}
      {children}
    </div>
  ),
}));
vi.mock("./StreetView", () => ({ default: () => null }));
vi.mock("./RoutePointMarker", () => ({
  default: ({
    label,
    title,
    onClick,
  }: {
    label: string;
    title: string;
    onClick: () => void;
  }) => (
    <button aria-label={title} onClick={onClick}>
      {label}
    </button>
  ),
}));
vi.mock("./RoutePolyline", () => ({
  default: ({
    polylineArray,
  }: {
    polylineArray: google.maps.LatLngLiteral[];
  }) => <span aria-label="描画する経路">{JSON.stringify(polylineArray)}</span>,
}));

const start = { lat: 35, lng: 135 };
const goal = { lat: 36, lng: 136 };
const savedPath = [start, { lat: 35.5, lng: 135.4 }, goal];
const markers: RouteMapMarker[] = [
  { id: "start", position: start, label: "S", title: "スタート" },
  { id: "goal", position: goal, label: "G", title: "ゴール" },
];

beforeEach(() => {
  vi.clearAllMocks();
  focusMapOnRoute.mockReturnValue(true);
});
afterEach(cleanup);

describe("RouteMapView", () => {
  it("取得処理や認証Providerなしで、渡された経路とマーカーだけを表示する", () => {
    render(
      <GoogleMapProvider>
        <RouteMapView
          initialCenter={start}
          path={savedPath}
          markers={markers}
        />
      </GoogleMapProvider>,
    );
    expect(screen.getByLabelText("描画する経路")).toHaveTextContent(
      JSON.stringify(savedPath),
    );
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "スタート" })).toHaveTextContent(
      "S",
    );
    expect(screen.getByRole("button", { name: "ゴール" })).toHaveTextContent(
      "G",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("マーカーの既定操作は下見位置の移動で、指定した操作にも差し替えられる", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <GoogleMapProvider>
        <RouteMapView
          initialCenter={start}
          path={null}
          markers={[markers[0]!, { ...markers[1]!, onClick }]}
        />
      </GoogleMapProvider>,
    );
    await user.click(screen.getByRole("button", { name: "スタート" }));
    expect(moveStreetView).toHaveBeenCalledWith(start);
    await user.click(screen.getByRole("button", { name: "ゴール" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(moveStreetView).toHaveBeenCalledTimes(1);
  });

  it("経路データが揃ってから、マーカーの位置でなく経路全体を表示範囲に使う", () => {
    const { rerender } = render(
      <GoogleMapProvider>
        <RouteMapView
          initialCenter={start}
          path={null}
          markers={markers}
          isLoading
          fitToRoute
        />
      </GoogleMapProvider>,
    );
    expect(focusMapOnRoute).not.toHaveBeenCalled();
    rerender(
      <GoogleMapProvider>
        <RouteMapView
          initialCenter={start}
          path={savedPath}
          markers={markers}
          fitToRoute
        />
      </GoogleMapProvider>,
    );
    expect(focusMapOnRoute).toHaveBeenCalledWith(savedPath);
    rerender(
      <GoogleMapProvider>
        <RouteMapView
          initialCenter={start}
          path={[goal, start]}
          markers={markers}
          fitToRoute
        />
      </GoogleMapProvider>,
    );
    expect(focusMapOnRoute).toHaveBeenCalledTimes(1);
  });

  it("読み込み中はマーカーを表示しない", () => {
    render(
      <GoogleMapProvider>
        <RouteMapView
          initialCenter={start}
          path={null}
          markers={markers}
          isLoading
        />
      </GoogleMapProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("読み込み中");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
