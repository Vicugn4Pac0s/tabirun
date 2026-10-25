import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import RouteMapView from "./RouteMapView";
import type { RouteMapMarker } from "../types";

const { moveStreetView, focusMapOnRoute, renderStreetView } = vi.hoisted(
  () => ({
    moveStreetView: vi.fn(),
    renderStreetView: vi.fn(),
    focusMapOnRoute: vi.fn(),
  }),
);
vi.mock("~/frontend/features/googlemap/hooks/useMoveStreetView", () => ({
  useMoveStreetView: () => moveStreetView,
}));
vi.mock("~/frontend/features/googlemap/hooks/useFocusMapOnRoute", () => ({
  useFocusMapOnRoute: () => ({ focusMapOnRoute }),
}));
vi.mock("~/frontend/features/googlemap/components/GoogleMapView", () => ({
  default: ({
    children,
    isLoading,
    onClick,
  }: {
    children: React.ReactNode;
    isLoading: boolean;
    onClick?: (event: {
      latLng: { toJSON: () => google.maps.LatLngLiteral };
    }) => void;
  }) => (
    <div>
      <div
        data-testid="map"
        onClick={() =>
          onClick?.({ latLng: { toJSON: () => ({ lat: 35, lng: 135 }) } })
        }
      />
      {isLoading && <p role="status">読み込み中</p>}
      {children}
    </div>
  ),
}));
vi.mock("~/frontend/features/googlemap/components/StreetView", () => ({
  default: ({
    onPositionChanged,
  }: {
    onPositionChanged: (position: {
      toJSON: () => google.maps.LatLngLiteral;
    }) => void;
  }) => {
    renderStreetView();
    return (
      <button
        onClick={() =>
          onPositionChanged({ toJSON: () => ({ lat: 35.5, lng: 135.5 }) })
        }
      >
        下見地点を変更
      </button>
    );
  },
}));
vi.mock("./RoutePointMarker", () => ({
  default: ({
    label,
    title,
    onClick,
  }: {
    label: string;
    title: string;
    onClick?: () => void;
  }) => (
    <button aria-label={title} onClick={onClick}>
      {label}
    </button>
  ),
}));
vi.mock("~/frontend/features/googlemap/components/Polyline", () => ({
  default: ({ path }: { path: google.maps.LatLngLiteral[] }) => (
    <span aria-label="描画する経路">{JSON.stringify(path)}</span>
  ),
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
          showStreetView
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

  it("省略時はStreet Viewを初期化せず、地図やマーカーを押しても下見を開始しない", async () => {
    const user = userEvent.setup();
    const onSelectedPointChange = vi.fn();
    render(
      <GoogleMapProvider>
        <RouteMapView
          initialCenter={start}
          path={savedPath}
          markers={markers}
          onSelectedPointChange={onSelectedPointChange}
        />
      </GoogleMapProvider>,
    );
    expect(renderStreetView).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("region", { name: "Street Viewで下見" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByTestId("map"));
    await user.click(screen.getByRole("button", { name: "スタート" }));
    expect(moveStreetView).not.toHaveBeenCalled();
    expect(onSelectedPointChange).not.toHaveBeenCalled();
  });

  it("Street Viewで確定した表示位置を選択地点として通知する", async () => {
    const user = userEvent.setup();
    const onSelectedPointChange = vi.fn();
    render(
      <GoogleMapProvider>
        <RouteMapView
          showStreetView
          initialCenter={start}
          path={null}
          markers={markers}
          onSelectedPointChange={onSelectedPointChange}
        />
      </GoogleMapProvider>,
    );
    await user.click(screen.getByRole("button", { name: "下見地点を変更" }));
    expect(onSelectedPointChange).toHaveBeenCalledWith({
      lat: 35.5,
      lng: 135.5,
    });
  });

  it("Street Viewが無効でも、画面側で指定したマーカー操作は維持する", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <GoogleMapProvider>
        <RouteMapView
          initialCenter={start}
          path={null}
          markers={[{ ...markers[0]!, onClick }]}
          showStreetView={false}
        />
      </GoogleMapProvider>,
    );
    await user.click(screen.getByRole("button", { name: "スタート" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(moveStreetView).not.toHaveBeenCalled();
  });

  it("表示中に無効化した場合も、パネルを外して連動操作を止める", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <GoogleMapProvider>
        <RouteMapView
          initialCenter={start}
          path={savedPath}
          markers={markers}
          showStreetView
        />
      </GoogleMapProvider>,
    );
    expect(renderStreetView).toHaveBeenCalled();
    expect(
      screen.getByRole("region", { name: "Street Viewで下見" }),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("map").closest("[data-street-view]"),
    ).toHaveAttribute("data-street-view", "visible");
    await user.click(screen.getByTestId("map"));
    expect(moveStreetView).toHaveBeenCalledWith(start);
    moveStreetView.mockClear();
    rerender(
      <GoogleMapProvider>
        <RouteMapView
          initialCenter={start}
          path={savedPath}
          markers={markers}
          showStreetView={false}
        />
      </GoogleMapProvider>,
    );
    expect(
      screen.queryByRole("region", { name: "Street Viewで下見" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("map").closest("[data-street-view]"),
    ).toHaveAttribute("data-street-view", "hidden");
    await user.click(screen.getByTestId("map"));
    await user.click(screen.getByRole("button", { name: "スタート" }));
    expect(moveStreetView).not.toHaveBeenCalled();
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
