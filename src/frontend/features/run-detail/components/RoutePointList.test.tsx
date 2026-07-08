import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoutePointList from "~/frontend/features/run-detail/components/RoutePointList";

vi.mock("~/frontend/features/route-points/components/RoutePointListItem", () => ({
  __esModule: true,
  default: ({
    index,
    onClick,
  }: {
    index: number;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      項目{index + 1}
    </button>
  ),
}));

describe("RoutePointList", () => {
  it("routePoints が空なら何も描画しない", () => {
    const { container } = render(<RoutePointList routePoints={[]} />);

    expect(container).toBeEmptyDOMElement();
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

    expect(screen.getByText("項目1")).toBeInTheDocument();
    expect(screen.getByText("項目2")).toBeInTheDocument();
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

    await user.click(screen.getByText("項目2"));

    expect(onRoutePointClick).toHaveBeenCalledWith(routePoints[1], 1);
  });
});
