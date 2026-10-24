import userEvent from "@testing-library/user-event";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteDetailWorkspace } from "./RouteDetailWorkspace";

const { directionsQuery, moveStreetView } = vi.hoisted(() => ({
  directionsQuery: vi.fn(),
  moveStreetView: vi.fn(),
}));
vi.mock("~/frontend/hooks/googlemap/useGooglemapDirectionQuery", () => ({
  default: directionsQuery,
}));
vi.mock("~/frontend/features/googlemap/hooks/useMoveStreetView", () => ({
  useMoveStreetView: () => moveStreetView,
}));
vi.mock("~/frontend/features/auth/components/AuthUserMenu", () => ({
  AuthUserMenu: () => null,
}));
vi.mock("~/frontend/features/googlemap/components/GoogleMapView", () => ({
  default: ({
    children,
    isLoading,
  }: {
    children: React.ReactNode;
    isLoading: boolean;
  }) => (
    <div aria-label="Google Map">
      {isLoading && <p role="status">経路を読み込み中</p>}
      {children}
    </div>
  ),
}));
vi.mock("~/frontend/features/googlemap/components/StreetView", () => ({
  default: () => <div>パノラマ</div>,
}));
vi.mock("~/frontend/features/googlemap/components/RoutePointMarker", () => ({
  default: () => null,
}));
vi.mock("~/frontend/features/googlemap/components/RoutePolyline", () => ({
  default: () => <span>経路線</span>,
}));

const route = {
  title: "朝のルート",
  points: [
    { lat: 35, lng: 135 },
    { lat: 36, lng: 136 },
  ],
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false })),
  );
  directionsQuery.mockReturnValue({
    directions: { path: route.points },
    isLoading: false,
    error: null,
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("RouteDetailWorkspace", () => {
  it("既存mapと共通の外枠と表示部品で、ルート情報・地図・Street Viewを表示する", () => {
    render(<RouteDetailWorkspace route={route} />);
    const sidebar = screen.getByRole("complementary", { name: "ルート情報" });
    expect(
      within(sidebar).getByRole("heading", { name: "朝のルート" }),
    ).toBeInTheDocument();
    expect(within(sidebar).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByLabelText("Google Map")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Street Viewで下見" }),
    ).toBeInTheDocument();
    expect(screen.getByText("経路線")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /追加|削除|保存|編集/ }),
    ).not.toBeInTheDocument();
  });

  it("サイドバーの経由地点から下見位置を移動できる", async () => {
    const user = userEvent.setup();
    render(<RouteDetailWorkspace route={route} />);
    const sidebar = screen.getByRole("complementary", { name: "ルート情報" });
    await user.click(
      within(sidebar).getAllByRole("button", { name: "移動" })[1]!,
    );
    expect(moveStreetView).toHaveBeenCalledWith(route.points[1]);
  });

  it("モバイルではルート情報を開いて確認できる", async () => {
    const user = userEvent.setup();
    render(<RouteDetailWorkspace route={route} />);
    await user.click(screen.getByRole("button", { name: "ルート情報を開く" }));
    expect(
      within(screen.getByRole("dialog")).getByRole("heading", {
        name: "朝のルート",
      }),
    ).toBeInTheDocument();
  });

  it("経路取得に失敗しても地図とStreet Viewを残し、警告を表示する", () => {
    directionsQuery.mockReturnValue({
      directions: null,
      isLoading: false,
      error: new Error("failed"),
    });
    render(<RouteDetailWorkspace route={route} />);
    expect(screen.getByRole("alert")).toHaveTextContent("経由地点のみ表示");
    expect(screen.queryByText("経路線")).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Street Viewで下見" }),
    ).toBeInTheDocument();
  });
});
