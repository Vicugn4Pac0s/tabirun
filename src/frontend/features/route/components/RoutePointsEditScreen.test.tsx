import type Link from "next/link";
import type { ComponentProps, ComponentPropsWithoutRef } from "react";
import userEvent from "@testing-library/user-event";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoutePointsEditScreen } from "./RoutePointsEditScreen";

const { directionsQuery, updatePoints, push, refresh } = vi.hoisted(() => ({
  directionsQuery: vi.fn(),
  updatePoints: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/link", async () => {
  const { forwardRef } = await import("react");
  type LinkProps = ComponentPropsWithoutRef<typeof Link>;
  return {
    default: forwardRef<HTMLAnchorElement, LinkProps>(function TestLink(
      { href, onClick, onNavigate, children, ...props },
      ref,
    ) {
      return (
        <a
          {...props}
          ref={ref}
          href={typeof href === "string" ? href : (href.pathname ?? undefined)}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) {
              let prevented = false;
              onNavigate?.({
                preventDefault: () => {
                  prevented = true;
                },
              });
              if (!prevented) push(href);
            }
            event.preventDefault();
          }}
        >
          {children}
        </a>
      );
    }),
  };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("../api/useUpdateRoutePoints", () => ({
  useUpdateRoutePoints: () => ({ updatePoints, isUpdating: false }),
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
vi.mock("~/frontend/features/auth/components/AuthUserMenu", async () => {
  const { useNavigationGuard } = await import(
    "~/frontend/providers/NavigationGuardProvider"
  );
  return {
    AuthUserMenu: function TestUserMenu() {
      const confirmNavigation = useNavigationGuard();
      return (
        <button
          onClick={() => {
            if (!confirmNavigation || confirmNavigation())
              push("/settings/profile");
          }}
        >
          プロフィールへ移動
        </button>
      );
    },
  };
});
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
  ComponentProps<typeof RoutePointsEditScreen>["route"]["direction"]
>;
const route = {
  status: "completed",
  id: 1,
  direction: savedDirection,
  directionErrorCode: null,
  points: [
    { lat: 35, lng: 135 },
    { lat: 35.5, lng: 135.5 },
    { lat: 36, lng: 136 },
  ],
} satisfies ComponentProps<typeof RoutePointsEditScreen>["route"];
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
  updatePoints.mockResolvedValue(undefined);
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

describe("RoutePointsEditScreen", () => {
  it("取得済みの経路距離をSPメニューボタンに表示する", () => {
    setMobileViewport();
    render(<RoutePointsEditScreen route={route} />);
    expect(
      screen.getByRole("button", { name: "ルート編集を開く" }),
    ).toHaveTextContent("5.2 km");
  });

  it("地点変更後の経路取得中はSPメニューに計測中を表示する", async () => {
    setMobileViewport();
    directionsQuery.mockReturnValue({
      directions: null,
      isLoading: true,
      error: null,
    });
    const user = userEvent.setup();
    render(<RoutePointsEditScreen route={route} />);
    await user.click(screen.getByRole("button", { name: "地点を削除" }));
    expect(
      screen.getByRole("button", { name: "ルート編集を開く" }),
    ).toHaveTextContent("MEASURING");
  });

  it("既存の外枠で名前入力を出さず経由地点一覧・全地点マーカーを表示する", () => {
    render(<RoutePointsEditScreen route={route} />);
    const sidebar = screen.getByRole("complementary", { name: "ルート編集" });
    expect(
      within(sidebar).getByRole("heading", { name: "ルートを編集" }),
    ).toBeInTheDocument();
    expect(
      within(sidebar).queryByRole("textbox", { name: "ルート名" }),
    ).toBeNull();
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

  it("モバイルでも編集用のサイドバーを開ける", async () => {
    setMobileViewport();
    const user = userEvent.setup();
    render(<RoutePointsEditScreen route={route} />);
    await user.click(screen.getByRole("button", { name: "ルート編集を開く" }));
    expect(
      within(screen.getByRole("dialog", { name: "ルート編集" })).getByRole(
        "button",
        { name: "更新する" },
      ),
    ).toBeDisabled();
  });

  it("保存済み経路の取得失敗時も初期値と編集欄を保持する", () => {
    render(
      <RoutePointsEditScreen
        route={{
          ...route,
          direction: null,
          directionErrorCode: "INTERNAL_SERVER_ERROR",
        }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("経由地点のみ表示");
    expect(screen.queryByRole("textbox", { name: "ルート名" })).toBeNull();
    expect(screen.getAllByRole("img")).toHaveLength(3);
    expect(screen.queryByText("経路線")).not.toBeInTheDocument();
    expect(directionsQuery).toHaveBeenLastCalledWith(route.points, {
      enabled: false,
    });
  });

  it("保存済みの直線経路を初期表示し、再計算しない", () => {
    render(
      <RoutePointsEditScreen
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
    expect(screen.getByText("経路線")).toHaveAttribute(
      "data-path",
      JSON.stringify(route.points),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("直線で結んで表示");
    expect(screen.getByText("距離を表示できません。")).toBeInTheDocument();
    expect(directionsQuery).toHaveBeenLastCalledWith(route.points, {
      enabled: false,
    });
  });

  it("地点を変更してリセットすると保存済み経路に戻る", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<RoutePointsEditScreen route={route} />);
    await user.click(screen.getByRole("button", { name: "地点を削除" }));
    expect(directionsQuery).toHaveBeenLastCalledWith(route.points.slice(1), {
      enabled: true,
    });
    await user.click(screen.getByRole("button", { name: "リセット" }));
    expect(directionsQuery).toHaveBeenLastCalledWith(route.points, {
      enabled: false,
    });
    expect(screen.getByText("経路線")).toHaveAttribute(
      "data-path",
      JSON.stringify(savedDirection.path),
    );
  });

  it("地点を削除して経路を再計算し、地点だけを保存する", async () => {
    const user = userEvent.setup();
    render(<RoutePointsEditScreen route={route} />);
    await user.click(screen.getByRole("button", { name: "地点を削除" }));
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(directionsQuery).toHaveBeenLastCalledWith(route.points.slice(1), {
      enabled: true,
    });
    await user.click(screen.getByRole("button", { name: "更新する" }));
    expect(updatePoints).toHaveBeenCalledWith({
      id: 1,
      points: route.points.slice(1),
    });
    expect(push).toHaveBeenCalledWith("/routes/1");
    expect(refresh).toHaveBeenCalled();
    expect(route.points).toHaveLength(3);
  });

  it("ルート名を変えずに地点だけ変更して更新できる", async () => {
    const user = userEvent.setup();
    render(<RoutePointsEditScreen route={route} />);
    await user.click(screen.getByRole("button", { name: "地点を削除" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "更新する" })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: "更新する" }));
    expect(updatePoints).toHaveBeenCalledWith({
      id: route.id,
      points: route.points.slice(1),
    });
  });

  it("更新失敗時は入力と地点を保持して再試行できる", async () => {
    updatePoints.mockRejectedValue(new Error("failed"));
    const user = userEvent.setup();
    render(<RoutePointsEditScreen route={route} />);
    await user.click(screen.getByRole("button", { name: "地点を削除" }));
    await user.click(screen.getByRole("button", { name: "更新する" }));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "更新する" })).toBeEnabled();
  });

  it("未保存時に戻る操作の破棄を確認し、リセットは承認時だけ行う", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<RoutePointsEditScreen route={route} />);
    await user.click(screen.getByRole("button", { name: "地点を削除" }));
    await user.click(screen.getByRole("link", { name: "ルートに戻る" }));
    expect(confirm).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "リセット" }));
    expect(screen.getAllByRole("img")).toHaveLength(2);
    confirm.mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "リセット" }));
    expect(screen.queryByRole("textbox", { name: "ルート名" })).toBeNull();
    expect(screen.getByRole("button", { name: "更新する" })).toBeDisabled();
  });
  it("プロフィールへ移動するとき未変更なら確認せず、編集中は許可した場合だけ移動する", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<RoutePointsEditScreen route={route} />);
    await user.click(
      screen.getByRole("button", { name: "プロフィールへ移動" }),
    );
    expect(confirm).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/settings/profile");
    push.mockClear();
    await user.click(screen.getByRole("button", { name: "地点を削除" }));
    await user.click(
      screen.getByRole("button", { name: "プロフィールへ移動" }),
    );
    expect(confirm).toHaveBeenCalledWith(
      "未保存の変更があります。破棄して移動しますか？",
    );
    expect(push).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    await user.click(
      screen.getByRole("button", { name: "プロフィールへ移動" }),
    );
    expect(push).toHaveBeenCalledWith("/settings/profile");
    confirm.mockRestore();
  });
});
