import userEvent from "@testing-library/user-event";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteCreateScreen } from "./RouteCreateScreen";

const { directionsQuery, createRoute, push, refresh } = vi.hoisted(() => ({
  directionsQuery: vi.fn(),
  createRoute: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("../api/useCreateRoute", () => ({
  useCreateRoute: () => ({ createRoute, isCreating: false }),
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
      return (
        <button
          onClick={() =>
            onPositionChanged({ toJSON: () => ({ lat: 36, lng: 136 }) })
          }
        >
          Street Viewを次の地点へ
        </button>
      );
    },
  };
});
vi.mock("~/frontend/features/googlemap/components/RoutePointMarker", () => ({
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

beforeEach(() => {
  vi.clearAllMocks();
  createRoute.mockResolvedValue(undefined);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false })),
  );
  directionsQuery.mockReturnValue({
    directions: null,
    isLoading: false,
    error: null,
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
const defaultCenter = { lat: 35, lng: 135 };
describe("RouteCreateScreen", () => {
  it("空の作成画面から地点を追加し、経路を再計算して保存する", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <RouteCreateScreen defaultCenter={defaultCenter} />,
    );
    expect(
      screen.getByRole("heading", { name: "ルートを作成" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "ルート名" })).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "ルートを保存する" }),
    ).toBeDisabled();
    expect(
      screen.getByText("保存するには2地点以上を登録してください。"),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("region", { name: "Street Viewで下見" }),
      ).queryByRole("button", { name: "地点を追加" }),
    ).not.toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: "ルート名" }),
      "朝のルート",
    );
    await user.click(screen.getByRole("button", { name: "地点を追加" }));
    expect(
      screen.getByRole("heading", { name: "経由地点（1 地点）" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Street Viewを次の地点へ" }),
    );
    await user.click(screen.getByRole("button", { name: "地点を追加" }));
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(directionsQuery).toHaveBeenLastCalledWith(
      [defaultCenter, { lat: 36, lng: 136 }],
      { enabled: true },
    );
    directionsQuery.mockReturnValue({
      directions: {
        path: [defaultCenter, { lat: 36, lng: 136 }],
        distanceMeters: 5200,
      },
      isLoading: false,
      error: null,
    });
    rerender(<RouteCreateScreen defaultCenter={defaultCenter} />);
    expect(screen.getByText("5.2")).toBeInTheDocument();
    expect(screen.getByText("予想時間")).toBeInTheDocument();
    expect(screen.getByText("消費カロリー")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ルートを保存する" }));
    expect(createRoute).toHaveBeenCalledWith({
      title: "朝のルート",
      points: [defaultCenter, { lat: 36, lng: 136 }],
    });
    expect(push).toHaveBeenCalledWith("/");
  });
  it("SPメニューでも名前入力と保存ボタンを表示する", async () => {
    const user = userEvent.setup();
    render(<RouteCreateScreen defaultCenter={defaultCenter} />);
    await user.click(screen.getByRole("button", { name: "ルート作成を開く" }));
    const dialog = screen.getByRole("dialog", { name: "ルート作成" });
    expect(
      within(dialog).getByRole("textbox", { name: "ルート名" }),
    ).toHaveValue("");
    expect(
      within(dialog).getByRole("button", { name: "ルートを保存する" }),
    ).toBeDisabled();
  });

  it("利用上限に達したら登録地点を直線で結ぶ", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <RouteCreateScreen defaultCenter={defaultCenter} />,
    );
    await user.click(screen.getByRole("button", { name: "地点を追加" }));
    await user.click(
      screen.getByRole("button", { name: "Street Viewを次の地点へ" }),
    );
    await user.click(screen.getByRole("button", { name: "地点を追加" }));

    const points = [defaultCenter, { lat: 36, lng: 136 }];
    directionsQuery.mockReturnValue({
      directions: null,
      isLoading: false,
      error: { data: { code: "TOO_MANY_REQUESTS" } },
    });
    rerender(<RouteCreateScreen defaultCenter={defaultCenter} />);

    expect(screen.getByText("経路線")).toHaveAttribute(
      "data-path",
      JSON.stringify(points),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("直線で結んで表示");
    expect(screen.getByText("距離を表示できません。")).toBeInTheDocument();
  });
});
