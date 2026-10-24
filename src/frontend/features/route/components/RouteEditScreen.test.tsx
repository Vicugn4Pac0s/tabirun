import userEvent from "@testing-library/user-event";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteEditScreen } from "./RouteEditScreen";

const { directionsQuery } = vi.hoisted(() => ({
  directionsQuery: vi.fn(),
}));
vi.mock("~/frontend/hooks/googlemap/useGooglemapDirectionQuery", () => ({
  default: directionsQuery,
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

describe("RouteEditScreen", () => {
  it("取得済みの経路距離をSPメニューボタンに表示する", () => {
    directionsQuery.mockReturnValue({
      directions: { path: route.points, distanceMeters: 5200 },
      isLoading: false,
      error: null,
    });
    render(<RouteEditScreen route={route} />);
    expect(
      screen.getByRole("button", { name: "ルート編集を開く" }),
    ).toHaveTextContent("5.2 km");
  });

  it("経路取得中はSPメニューに計測中を表示する", () => {
    directionsQuery.mockReturnValue({
      directions: null,
      isLoading: true,
      error: null,
    });
    render(<RouteEditScreen route={route} />);
    expect(
      screen.getByRole("button", { name: "ルート編集を開く" }),
    ).toHaveTextContent("MEASURING");
  });

  it("既存の外枠で名前・経由地点一覧・全地点マーカーを表示する", () => {
    render(<RouteEditScreen route={route} />);
    const sidebar = screen.getByRole("complementary", { name: "ルート編集" });
    expect(
      within(sidebar).getByRole("heading", { name: "ルートを編集" }),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByRole("textbox", { name: "ルート名" }),
    ).toHaveValue(route.title);
    expect(within(sidebar).getAllByRole("listitem")).toHaveLength(3);
    expect(
      within(sidebar).getByRole("link", { name: "ルートに戻る" }),
    ).toHaveAttribute("href", "/routes/1");
    expect(screen.getAllByRole("img")).toHaveLength(3);
    expect(screen.getByRole("img", { name: "地点 2" })).toHaveTextContent("2");
    expect(
      screen.getByRole("region", { name: "Street Viewで下見" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("入力内容はまだ保存できません。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /保存|更新|追加|削除/ }),
    ).not.toBeInTheDocument();
  });

  it("名前を入力しても保存済みデータと経由地点は変えない", async () => {
    const user = userEvent.setup();
    render(<RouteEditScreen route={route} />);
    const input = screen.getByRole("textbox", { name: "ルート名" });
    await user.clear(input);
    await user.type(input, "夜のルート");
    expect(input).toHaveValue("夜のルート");
    expect(route.title).toBe("朝のルート");
    expect(directionsQuery).toHaveBeenLastCalledWith(route.points, {
      enabled: true,
    });
  });

  it("モバイルでも編集用のサイドバーを開ける", async () => {
    const user = userEvent.setup();
    render(<RouteEditScreen route={route} />);
    await user.click(screen.getByRole("button", { name: "ルート編集を開く" }));
    expect(
      within(screen.getByRole("dialog", { name: "ルート編集" })).getByRole(
        "textbox",
        { name: "ルート名" },
      ),
    ).toHaveValue(route.title);
  });

  it("経路取得に失敗しても初期値と編集欄を保持する", () => {
    directionsQuery.mockReturnValue({
      directions: null,
      isLoading: false,
      error: new Error("failed"),
    });
    render(<RouteEditScreen route={route} />);
    expect(screen.getByRole("alert")).toHaveTextContent("経由地点のみ表示");
    expect(screen.getByRole("textbox", { name: "ルート名" })).toHaveValue(
      route.title,
    );
    expect(screen.getAllByRole("img")).toHaveLength(3);
  });
});
