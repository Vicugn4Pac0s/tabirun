import userEvent from "@testing-library/user-event";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteEditScreen } from "./RouteEditScreen";

const { directionsQuery, updateRoute, push, refresh } = vi.hoisted(() => ({
  directionsQuery: vi.fn(),
  updateRoute: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("../api/useUpdateRoute", () => ({
  useUpdateRoute: () => ({ updateRoute, isUpdating: false }),
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
vi.mock("~/frontend/features/googlemap/components/StreetView", async () => {
  const { useEffect, useRef } = await import("react");
  return {
    default: function MockStreetView({
      onPositionChanged,
    }: {
      onPositionChanged: (position: {
        toJSON: () => { lat: number; lng: number };
      }) => void;
    }) {
      const onInitPosition = useRef(onPositionChanged);
      useEffect(() => {
        onInitPosition.current({ toJSON: () => ({ lat: 35, lng: 135 }) });
      }, []);
      return <div>パノラマ</div>;
    },
  };
});
vi.mock("./RoutePointMarker", () => ({
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

const route = {
  id: 1,
  title: "朝のルート",
  points: [
    { lat: 35, lng: 135 },
    { lat: 35.5, lng: 135.5 },
    { lat: 36, lng: 136 },
  ],
};
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
  updateRoute.mockResolvedValue(undefined);
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
  vi.restoreAllMocks();
});

describe("RouteEditScreen", () => {
  it("取得済みの経路距離をSPメニューボタンに表示する", () => {
    setMobileViewport();
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
    setMobileViewport();
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
    expect(screen.getByRole("button", { name: "更新する" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "地点を削除" })).toBeEnabled();
    expect(
      within(
        screen.getByRole("region", { name: "Street Viewで下見" }),
      ).queryByRole("button", { name: "地点を削除" }),
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
    setMobileViewport();
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
    expect(
      within(
        screen.getByRole("complementary", { name: "ルート編集" }),
      ).getByRole("alert"),
    ).toHaveTextContent("経由地点のみ表示");
    expect(screen.getByRole("textbox", { name: "ルート名" })).toHaveValue(
      route.title,
    );
    expect(screen.getAllByRole("img")).toHaveLength(3);
  });
  it("利用上限に達したら編集中の地点を直線で結ぶ", () => {
    directionsQuery.mockReturnValue({
      directions: null,
      isLoading: false,
      error: { data: { code: "TOO_MANY_REQUESTS" } },
    });

    render(<RouteEditScreen route={route} />);

    expect(screen.getByText("経路線")).toHaveAttribute(
      "data-path",
      JSON.stringify(route.points),
    );
    expect(
      within(
        screen.getByRole("complementary", { name: "ルート編集" }),
      ).getByRole("alert"),
    ).toHaveTextContent("直線で結んで表示");
    expect(screen.getByText("距離を表示できません。")).toBeInTheDocument();
  });
  it("地点を削除して経路を再計算し、入力した名前と地点を保存する", async () => {
    const user = userEvent.setup();
    render(<RouteEditScreen route={route} />);
    await user.click(screen.getByRole("button", { name: "地点を削除" }));
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(directionsQuery).toHaveBeenLastCalledWith(route.points.slice(1), {
      enabled: true,
    });
    const input = screen.getByRole("textbox", { name: "ルート名" });
    await user.clear(input);
    await user.type(input, " 夜のルート ");
    await user.click(screen.getByRole("button", { name: "更新する" }));
    expect(updateRoute).toHaveBeenCalledWith({
      id: 1,
      title: "夜のルート",
      points: route.points.slice(1),
    });
    expect(push).toHaveBeenCalledWith("/routes/1");
    expect(refresh).toHaveBeenCalled();
    expect(route.points).toHaveLength(3);
  });

  it("ルート名を変えずに地点だけ変更して更新できる", async () => {
    const user = userEvent.setup();
    render(<RouteEditScreen route={route} />);
    await user.click(screen.getByRole("button", { name: "地点を削除" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "更新する" })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: "更新する" }));
    expect(updateRoute).toHaveBeenCalledWith({
      id: route.id,
      title: route.title,
      points: route.points.slice(1),
    });
  });

  it("更新失敗時は入力と地点を保持して再試行できる", async () => {
    updateRoute.mockRejectedValue(new Error("failed"));
    const user = userEvent.setup();
    render(<RouteEditScreen route={route} />);
    await user.type(screen.getByRole("textbox", { name: "ルート名" }), "変更");
    await user.click(screen.getByRole("button", { name: "更新する" }));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "ルート名" })).toHaveValue(
      "朝のルート変更",
    );
    expect(screen.getByRole("button", { name: "更新する" })).toBeEnabled();
  });

  it("未保存時に戻る操作の破棄を確認し、リセットは承認時だけ行う", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<RouteEditScreen route={route} />);
    await user.type(screen.getByRole("textbox", { name: "ルート名" }), "変更");
    await user.click(screen.getByRole("link", { name: "ルートに戻る" }));
    expect(confirm).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "リセット" }));
    expect(screen.getByRole("textbox", { name: "ルート名" })).toHaveValue(
      "朝のルート変更",
    );
    confirm.mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "リセット" }));
    expect(screen.getByRole("textbox", { name: "ルート名" })).toHaveValue(
      route.title,
    );
    expect(screen.getByRole("button", { name: "更新する" })).toBeDisabled();
  });
});
