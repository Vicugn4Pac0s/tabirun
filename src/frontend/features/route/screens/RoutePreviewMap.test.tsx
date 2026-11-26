import type { ComponentProps } from "react";
import userEvent from "@testing-library/user-event";
import {
  fireEvent,
  cleanup,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoutePreviewMap } from "./RoutePreviewMap";

const { directionsQuery } = vi.hoisted(() => ({
  directionsQuery: vi.fn(),
}));
vi.mock("~/frontend/features/googlemap/api/useGoogleMapDirectionQuery", () => ({
  useGoogleMapDirectionQuery: directionsQuery,
}));
vi.mock("~/frontend/features/user/api/useCurrentUserQuery", () => ({
  useCurrentUserQuery: () => ({ user: { pace: "5:00", weight: 60 } }),
}));
vi.mock("~/frontend/features/pace/components/PaceSelect", () => ({
  default: ({
    value,
    onChangeValue,
  }: {
    value: string;
    onChangeValue: (pace: "6:00") => void;
  }) => (
    <button type="button" onClick={() => onChangeValue("6:00")}>
      ペース {value}
    </button>
  ),
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
vi.mock("../components/RoutePointMarker", () => ({
  default: ({ label, title }: { label: string; title: string }) => (
    <span role="img" aria-label={title}>
      {label}
    </span>
  ),
}));
vi.mock("~/frontend/features/googlemap/components/Polyline", () => ({
  default: ({ path }: { path: google.maps.LatLngLiteral[] }) => (
    <span data-path={JSON.stringify(path)}>経路線</span>
  ),
}));

const savedDirection = {
  directionSource: "routes_api",
  encodedPolyline: "saved-polyline",
  distanceMeters: 5200,
  duration: "1800s",
  directionCalculatedAt: new Date("2026-11-11T00:00:00Z"),
  directionPointsHash: "saved-hash",
  path: [
    { lat: 35, lng: 135 },
    { lat: 35.25, lng: 135.1 },
    { lat: 36, lng: 136 },
  ],
} satisfies NonNullable<
  ComponentProps<typeof RoutePreviewMap>["route"]["direction"]
>;
const route = {
  id: 1,
  title: "朝のルート",
  direction: savedDirection,
  directionErrorCode: null,
  points: [
    { lat: 35, lng: 135 },
    { lat: 35.5, lng: 135.5 },
    { lat: 36, lng: 136 },
  ],
} satisfies ComponentProps<typeof RoutePreviewMap>["route"];
const setMobileViewport = () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query === "(max-width: 767px)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false })),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function openDesktopPanel() {
  if (!window.matchMedia("(max-width: 767px)").matches) {
    fireEvent.click(screen.getByRole("button", { name: "ルート情報を開く" }));
  }
}

describe("RoutePreviewMap", () => {
  it("取得済みの経路距離をSPメニューボタンに表示する", () => {
    setMobileViewport();
    render(<RoutePreviewMap route={route} />);
    openDesktopPanel();
    expect(
      screen.getByRole("button", { name: "ルート情報を開く" }),
    ).toHaveTextContent("5.2 km");
  });

  it("取得済みの経路を表示し、再表示でも経路計算を呼ばない", () => {
    const { rerender } = render(<RoutePreviewMap route={route} />);
    openDesktopPanel();
    expect(screen.getByText("経路線")).toHaveAttribute(
      "data-path",
      JSON.stringify(savedDirection.path),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/計測中|経路を読み込み中/),
    ).not.toBeInTheDocument();
    rerender(<RoutePreviewMap route={{ ...route, title: "夜のルート" }} />);
    expect(directionsQuery).not.toHaveBeenCalled();
  });

  it("既存mapと共通の外枠と表示部品で、ルート情報・地図・Street Viewを表示する", () => {
    render(<RoutePreviewMap route={route} />);
    openDesktopPanel();
    const sidebar = screen.getByRole("complementary", { name: "ルート情報" });
    expect(
      within(sidebar).getByRole("heading", { name: "朝のルート" }),
    ).toBeInTheDocument();
    expect(within(sidebar).queryByRole("list")).not.toBeInTheDocument();
    expect(
      within(sidebar).queryByRole("button", { name: "移動" }),
    ).not.toBeInTheDocument();
    expect(directionsQuery).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Google Map")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Street Viewで下見" }),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByRole("link", { name: "ルート詳細に戻る" }),
    ).toHaveAttribute("href", "/routes/1");
    expect(screen.getByText("経路線")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "スタート" })).toHaveTextContent(
      "S",
    );
    expect(screen.getByRole("img", { name: "ゴール" })).toHaveTextContent("G");
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: /追加|保存|編集/ }),
    ).not.toBeInTheDocument();
  });

  it("周回コースではS/Gのマーカー1つだけを渡す", () => {
    render(
      <RoutePreviewMap
        route={{ ...route, points: [...route.points, route.points[0]!] }}
      />,
    );
    openDesktopPanel();
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(
      screen.getByRole("img", { name: "スタート／ゴール" }),
    ).toHaveTextContent("S/G");
  });

  it("モバイルではルート情報を開いて確認できる", async () => {
    setMobileViewport();
    const user = userEvent.setup();
    render(<RoutePreviewMap route={route} />);
    openDesktopPanel();
    await user.click(screen.getByRole("button", { name: "ルート情報を開く" }));
    expect(
      within(screen.getByRole("dialog", { name: "ルート情報" })).getByRole(
        "heading",
        {
          name: "朝のルート",
        },
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("dialog", { name: "ルート情報" })).getByText(
        "5.2",
      ),
    ).toBeInTheDocument();
  });

  it("経路取得に失敗しても地図とStreet Viewを残し、警告を表示する", () => {
    render(
      <RoutePreviewMap
        route={{
          ...route,
          direction: null,
          directionErrorCode: "INTERNAL_SERVER_ERROR",
        }}
      />,
    );
    openDesktopPanel();
    expect(
      within(screen.getByRole("region", { name: "ルートの地図" })).getByRole(
        "alert",
      ),
    ).toHaveTextContent("スタート・ゴールのみ表示");
    expect(screen.queryByText("経路線")).not.toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getByText("距離を表示できません。")).toBeInTheDocument();
    expect(directionsQuery).not.toHaveBeenCalled();
    expect(
      screen.getByRole("region", { name: "Street Viewで下見" }),
    ).toBeInTheDocument();
  });

  it("利用上限に達したら保存済みの全地点を直線で結ぶ", () => {
    render(
      <RoutePreviewMap
        route={{
          ...route,
          direction: {
            ...savedDirection,
            directionSource: "straight_line",
            encodedPolyline: null,
            distanceMeters: null,
            duration: null,
            path: route.points,
          },
        }}
      />,
    );
    openDesktopPanel();

    expect(screen.getByText("経路線")).toHaveAttribute(
      "data-path",
      JSON.stringify(route.points),
    );
    expect(
      within(screen.getByRole("region", { name: "ルートの地図" })).getByRole(
        "alert",
      ),
    ).toHaveTextContent("直線で結んで表示");
    expect(screen.getByText("距離を表示できません。")).toBeInTheDocument();
    expect(directionsQuery).not.toHaveBeenCalled();
  });
});
