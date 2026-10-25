import userEvent from "@testing-library/user-event";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteDetailScreen } from "./RouteDetailScreen";

const { directionsQuery } = vi.hoisted(() => ({
  directionsQuery: vi.fn(),
}));
vi.mock("~/frontend/features/googlemap/api/useGoogleMapDirectionQuery", () => ({
  useGoogleMapDirectionQuery: directionsQuery,
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
  default: ({ label, title }: { label: string; title: string }) => (
    <span role="img" aria-label={title}>
      {label}
    </span>
  ),
}));
vi.mock("~/frontend/features/googlemap/components/Polyline", () => ({
  default: () => <span>経路線</span>,
}));

const route = {
  id: 1,
  title: "朝のルート",
  points: [
    { lat: 35, lng: 135 },
    { lat: 35.5, lng: 135.5 },
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

describe("RouteDetailScreen", () => {
  it("取得済みの経路距離をSPメニューボタンに表示する", () => {
    directionsQuery.mockReturnValue({
      directions: { path: route.points, distanceMeters: 5200 },
      isLoading: false,
      error: null,
    });
    render(<RouteDetailScreen route={route} />);
    expect(
      screen.getByRole("button", { name: "ルート情報を開く" }),
    ).toHaveTextContent("5.2 km");
  });

  it("経路取得中はSPメニューに計測中を表示する", () => {
    directionsQuery.mockReturnValue({
      directions: null,
      isLoading: true,
      error: null,
    });
    render(<RouteDetailScreen route={route} />);
    expect(
      screen.getByRole("button", { name: "ルート情報を開く" }),
    ).toHaveTextContent("MEASURING");
  });

  it("既存mapと共通の外枠と表示部品で、ルート情報・地図・Street Viewを表示する", () => {
    render(<RouteDetailScreen route={route} />);
    const sidebar = screen.getByRole("complementary", { name: "ルート情報" });
    expect(
      within(sidebar).getByRole("heading", { name: "朝のルート" }),
    ).toBeInTheDocument();
    expect(within(sidebar).queryByRole("list")).not.toBeInTheDocument();
    expect(
      within(sidebar).queryByRole("button", { name: "移動" }),
    ).not.toBeInTheDocument();
    expect(directionsQuery).toHaveBeenCalledWith(route.points, {
      enabled: true,
    });
    expect(screen.getByLabelText("Google Map")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Street Viewで下見" }),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByRole("link", { name: "編集する" }),
    ).toHaveAttribute("href", "/routes/1/edit");
    expect(screen.getByText("経路線")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "スタート" })).toHaveTextContent(
      "S",
    );
    expect(screen.getByRole("img", { name: "ゴール" })).toHaveTextContent("G");
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: /追加|削除|保存|編集/ }),
    ).not.toBeInTheDocument();
  });

  it("周回コースではS/Gのマーカー1つだけを渡す", () => {
    render(
      <RouteDetailScreen
        route={{ ...route, points: [...route.points, route.points[0]!] }}
      />,
    );
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(
      screen.getByRole("img", { name: "スタート／ゴール" }),
    ).toHaveTextContent("S/G");
  });

  it("モバイルではルート情報を開いて確認できる", async () => {
    const user = userEvent.setup();
    render(<RouteDetailScreen route={route} />);
    await user.click(screen.getByRole("button", { name: "ルート情報を開く" }));
    expect(
      within(screen.getByRole("dialog", { name: "ルート情報" })).getByRole(
        "heading",
        {
          name: "朝のルート",
        },
      ),
    ).toBeInTheDocument();
  });

  it("経路取得に失敗しても地図とStreet Viewを残し、警告を表示する", () => {
    directionsQuery.mockReturnValue({
      directions: null,
      isLoading: false,
      error: new Error("failed"),
    });
    render(<RouteDetailScreen route={route} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "スタート・ゴールのみ表示",
    );
    expect(screen.queryByText("経路線")).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Street Viewで下見" }),
    ).toBeInTheDocument();
  });
});
