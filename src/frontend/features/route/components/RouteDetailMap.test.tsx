import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteDetailMap } from "./RouteDetailMap";

const { useDirections, mapView, usePreview, previewPoint } = vi.hoisted(() => ({
  useDirections: vi.fn(),
  mapView: vi.fn(),
  usePreview: vi.fn(),
  previewPoint: vi.fn(),
}));
vi.mock("../hooks/useRoutePreview", () => ({ useRoutePreview: usePreview }));
vi.mock("~/frontend/hooks/googlemap/useGooglemapDirectionQuery", () => ({
  default: useDirections,
}));
vi.mock("~/frontend/features/googlemap/components/GoogleMapView", () => ({
  default: (props: {
    children: ReactNode;
    isLoading: boolean;
    onClick?: (event: {
      latLng: { toJSON: () => google.maps.LatLngLiteral } | null;
    }) => void;
  }) => {
    mapView(props);
    return (
      <div>
        {props.isLoading && <p role="status">読み込み中</p>}
        <button
          aria-label="地図上の地点"
          onClick={() =>
            props.onClick?.({
              latLng: { toJSON: () => ({ lat: 37, lng: 137 }) },
            })
          }
        />
        {props.children}
      </div>
    );
  },
}));
vi.mock("~/frontend/features/googlemap/components/RoutePointMarker", () => ({
  default: ({ index, onClick }: { index: number; onClick?: () => void }) => (
    <button onClick={onClick}>地点 {index + 1}</button>
  ),
}));
vi.mock("~/frontend/features/googlemap/components/RoutePolyline", () => ({
  default: () => <span>経路線</span>,
}));

const points = [
  { lat: 35, lng: 135 },
  { lat: 36, lng: 136 },
];
function createPreview(streetViewUnavailable = false) {
  return {
    streetView: { current: null },
    streetViewUnavailable,
    position: null,
    pov: null,
    setPosition: vi.fn(),
    setPov: vi.fn(),
    previewPoint,
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  usePreview.mockReturnValue(createPreview());
  useDirections.mockReturnValue({
    directions: { path: points },
    isLoading: false,
    error: null,
  });
});
afterEach(cleanup);

describe("RouteDetailMap", () => {
  it("propsの地点から経路を取得し、経路と地点を表示する", () => {
    render(<RouteDetailMap points={points} />);
    expect(useDirections).toHaveBeenCalledWith(points, { enabled: true });
    expect(screen.getByText("経路線")).toBeInTheDocument();
    expect(screen.getByText("地点 1")).toBeInTheDocument();
    expect(screen.getByText("地点 2")).toBeInTheDocument();
    expect(mapView.mock.calls[0]?.[0]).toHaveProperty(
      "options.streetViewControl",
      false,
    );
    expect(
      screen.queryByRole("button", { name: /追加|削除|保存/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Street Viewで下見" }),
    ).toBeInTheDocument();
  });

  it("地図・マーカー・経由地点ボタンの選択で下見地点を移動する", async () => {
    const user = userEvent.setup();
    render(<RouteDetailMap points={points} />);
    await user.click(screen.getByRole("button", { name: "地図上の地点" }));
    expect(previewPoint).toHaveBeenLastCalledWith({ lat: 37, lng: 137 });
    await user.click(screen.getByRole("button", { name: "地点 2" }));
    expect(previewPoint).toHaveBeenLastCalledWith(points[1]);
    await user.click(screen.getByRole("button", { name: "地点 1 を下見" }));
    expect(previewPoint).toHaveBeenLastCalledWith(points[0]);
  });

  it("Street View非対応地点では別の地点を選べる案内を表示する", () => {
    usePreview.mockReturnValue(createPreview(true));
    render(<RouteDetailMap points={points} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "別の地点を選んでください",
    );
    expect(screen.getByRole("button", { name: "地点 1 を下見" })).toBeEnabled();
  });

  it("経路取得中はloadingを表示する", () => {
    useDirections.mockReturnValue({
      directions: null,
      isLoading: true,
      error: null,
    });
    render(<RouteDetailMap points={points} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("経路線")).not.toBeInTheDocument();
  });

  it("経路取得失敗時は警告と地点を表示し、直線を経路として表示しない", () => {
    useDirections.mockReturnValue({
      directions: null,
      isLoading: false,
      error: new Error("failed"),
    });
    render(<RouteDetailMap points={points} />);
    expect(screen.getByRole("alert")).toHaveTextContent("経由地点のみ表示");
    expect(screen.getByText("地点 1")).toBeInTheDocument();
    expect(screen.queryByText("経路線")).not.toBeInTheDocument();
  });
});
