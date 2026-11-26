import userEvent from "@testing-library/user-event";
import {
  fireEvent,
  cleanup,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteCreateMap } from "./RouteCreateMap";

const { directionsQuery, createDraft, push, replace, refresh } = vi.hoisted(
  () => ({
    directionsQuery: vi.fn(),
    createDraft: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
);
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, refresh }),
}));
vi.mock("../api/useCreateRouteDraft", () => ({
  useCreateRouteDraft: () => ({ createDraft, isCreating: false }),
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

beforeEach(() => {
  vi.clearAllMocks();
  createDraft.mockResolvedValue({ id: 42 });
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
vi.mock("../api/useRouteDraftsQuery", () => ({
  useRouteDraftsQuery: () => ({ drafts: [], isLoading: false, error: null }),
}));
const defaultCenter = { lat: 35, lng: 135 };
function openDesktopPanel() {
  if (!window.matchMedia("(max-width: 767px)").matches) {
    fireEvent.click(screen.getByRole("button", { name: "ルート作成を開く" }));
  }
}

describe("RouteCreateMap", () => {
  it("空の作成画面から地点を追加し、経路を再計算して保存する", async () => {
    const user = userEvent.setup({ delay: null });
    const { rerender } = render(
      <RouteCreateMap defaultCenter={defaultCenter} />,
    );
    openDesktopPanel();
    expect(
      screen.getByRole("heading", { name: "ルートを作成" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "ルート名" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "詳細入力へ進む" }),
    ).toBeDisabled();
    expect(
      screen.getByText("保存するには2地点以上を登録してください。"),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("region", { name: "Street Viewで下見" }),
      ).queryByRole("button", { name: "地点を追加" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "地点を追加" }));
    expect(screen.getByText("経由地点（1 地点）")).toBeInTheDocument();
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
    rerender(<RouteCreateMap defaultCenter={defaultCenter} />);
    expect(screen.getByText("5.2")).toBeInTheDocument();
    expect(screen.getByText("予想時間")).toBeInTheDocument();
    expect(screen.getByText("消費カロリー")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "詳細入力へ進む" }));
    expect(createDraft).toHaveBeenCalledWith({
      points: [defaultCenter, { lat: 36, lng: 136 }],
    });
    expect(replace).toHaveBeenCalledWith("/routes/42/details");
    expect(push).not.toHaveBeenCalled();
    // CI では入力〜保存まで通しで実行するため、デフォルト 5s では不足することがある
  }, 15_000);
  it("距離ボタンと閉じるボタンをEnterで操作しても地点を追加しない", async () => {
    const user = userEvent.setup();
    render(<RouteCreateMap defaultCenter={defaultCenter} />);
    const trigger = screen.getByRole("button", { name: "ルート作成を開く" });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("dialog", { name: "ルート作成" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "ルートの地点数" }),
    ).toHaveTextContent("地点 0 / 27");
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "ルートの地点数" }),
    ).toHaveTextContent("地点 0 / 27");
  });

  it("SPパネルに下書きの入口を残し、次へボタンは地図側に置く", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: query === "(max-width: 767px)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    const user = userEvent.setup();
    render(<RouteCreateMap defaultCenter={defaultCenter} />);
    openDesktopPanel();
    await user.click(screen.getByRole("button", { name: "ルート作成を開く" }));
    const dialog = screen.getByRole("dialog", { name: "ルート作成" });
    expect(
      within(dialog).queryByRole("textbox", { name: "ルート名" }),
    ).toBeNull();
    expect(
      within(dialog).queryByRole("button", { name: "詳細入力へ進む" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole("heading", {
        name: "作成途中のルートの続きから",
      }),
    ).toBeInTheDocument();
  });

  it("利用上限に達したら登録地点を直線で結び、警告を地図上で表示する", async () => {
    const user = userEvent.setup({ delay: null });
    const { rerender } = render(
      <RouteCreateMap defaultCenter={defaultCenter} />,
    );
    openDesktopPanel();
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
    rerender(<RouteCreateMap defaultCenter={defaultCenter} />);

    expect(screen.getByText("経路線")).toHaveAttribute(
      "data-path",
      JSON.stringify(points),
    );
    expect(
      within(screen.getByRole("region", { name: "ルートの地図" })).getByRole(
        "alert",
      ),
    ).toHaveTextContent("直線で結んで表示");
  });
  it("プロフィールへ移動するとき未変更なら確認せず、編集中は許可した場合だけ移動する", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<RouteCreateMap defaultCenter={defaultCenter} />);
    openDesktopPanel();
    await user.click(
      screen.getByRole("button", { name: "プロフィールへ移動" }),
    );
    expect(confirm).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/settings/profile");
    push.mockClear();
    await user.click(screen.getByRole("button", { name: "地点を追加" }));
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
