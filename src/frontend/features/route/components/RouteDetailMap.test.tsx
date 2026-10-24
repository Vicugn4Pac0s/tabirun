import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteDetailMap } from "./RouteDetailMap";

const { useDirections, mapView } = vi.hoisted(() => ({
  useDirections: vi.fn(),
  mapView: vi.fn(),
}));
vi.mock("~/frontend/hooks/googlemap/useGooglemapDirectionQuery", () => ({
  default: useDirections,
}));
vi.mock("~/frontend/features/googlemap/components/GoogleMapView", () => ({
  default: (props: { children: ReactNode; isLoading: boolean }) => {
    mapView(props);
    return (
      <div>
        {props.isLoading && <p role="status">読み込み中</p>}
        {props.children}
      </div>
    );
  },
}));
vi.mock("~/frontend/features/googlemap/components/RoutePointMarker", () => ({
  default: ({ index }: { index: number }) => <span>地点 {index + 1}</span>,
}));
vi.mock("~/frontend/features/googlemap/components/RoutePolyline", () => ({
  default: () => <span>経路線</span>,
}));

const points = [
  { lat: 35, lng: 135 },
  { lat: 36, lng: 136 },
];
beforeEach(() => {
  vi.clearAllMocks();
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
    expect(mapView.mock.calls[0]?.[0]).not.toHaveProperty("onClick");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
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
