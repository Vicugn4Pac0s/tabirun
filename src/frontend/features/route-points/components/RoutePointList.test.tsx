import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoutePointList from "./RoutePointList";

describe("RoutePointList", () => {
  it("routePoints が空でも件数を表示し、リストは描画しない", () => {
    render(<RoutePointList routePoints={[]} />);

    expect(screen.getByText("経由地点（0 地点）")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("routePoints の件数分だけ項目を描画する", () => {
    render(
      <RoutePointList
        routePoints={[
          { lat: 35.0, lng: 139.0 },
          { lat: 35.1, lng: 139.1 },
        ]}
      />,
    );

    expect(screen.getByText("経由地点（2 地点）")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "経由地点" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "地点1に移動" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "地点2に移動" }),
    ).toBeInTheDocument();
  });

  it("項目クリック時に point と index を渡して onRoutePointClick を呼ぶ", async () => {
    const user = userEvent.setup();
    const onRoutePointClick = vi.fn();
    const routePoints = [
      { lat: 35.0, lng: 139.0 },
      { lat: 35.1, lng: 139.1 },
    ];

    render(
      <RoutePointList
        routePoints={routePoints}
        onRoutePointClick={onRoutePointClick}
      />,
    );

    await user.click(screen.getByRole("button", { name: "地点2に移動" }));

    expect(onRoutePointClick).toHaveBeenCalledWith(routePoints[1], 1);
  });
});
