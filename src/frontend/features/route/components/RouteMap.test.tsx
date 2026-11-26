import type { ComponentProps } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RouteMap } from "./RouteMap";
import type RouteMapView from "./RouteMapView";

const { moveStreetView } = vi.hoisted(() => ({
  moveStreetView: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("~/frontend/features/googlemap/hooks/useMoveStreetView", () => ({
  useMoveStreetView: () => moveStreetView,
}));
vi.mock("./RouteMapView", () => ({
  default: ({
    markers,
    onSelectedPointChange,
    children,
  }: ComponentProps<typeof RouteMapView>) => (
    <div>
      {markers.map((marker) => (
        <span key={marker.id} role="img" aria-label={marker.title}>
          {marker.label}
        </span>
      ))}
      <button onClick={() => onSelectedPointChange?.({ lat: 35, lng: 135 })}>
        下見位置を選択
      </button>
      {children}
    </div>
  ),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const points = [
  { lat: 35, lng: 135 },
  { lat: 36, lng: 136 },
];
const initialCenter = { lat: 35, lng: 135 };
const markers = [
  {
    id: "display",
    position: initialCenter,
    label: "表示用",
    title: "描画マーカー",
  },
];

describe("RouteMap", () => {
  it("下見では渡されたマーカーと上部UI・警告だけを表示し、地点編集を出さない", async () => {
    const user = userEvent.setup();
    render(
      <RouteMap
        initialCenter={initialCenter}
        path={null}
        markers={markers}
        topLeft={<button>距離</button>}
        topRight={<button>上部操作</button>}
        warning="経路取得の警告"
      />,
    );
    expect(
      screen.getByRole("img", { name: "描画マーカー" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "距離" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "上部操作" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("経路取得の警告");
    await user.click(screen.getByRole("button", { name: "下見位置を選択" }));
    expect(
      screen.queryByRole("button", { name: "地点を削除" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: "ルートの地点数" }),
    ).not.toBeInTheDocument();
  });

  it("描画マーカーと編集地点を混同せず、選択した地点の操作を通知する", async () => {
    const user = userEvent.setup();
    const onTogglePoint = vi.fn();
    render(
      <RouteMap
        initialCenter={initialCenter}
        path={null}
        markers={markers}
        editing={{ points, disabled: false, onTogglePoint }}
      />,
    );
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(
      screen.getByRole("status", { name: "ルートの地点数" }),
    ).toHaveTextContent("地点 2 / 27");
    await user.click(screen.getByRole("button", { name: "下見位置を選択" }));
    await user.click(screen.getByRole("button", { name: "地点を削除" }));
    expect(onTogglePoint).toHaveBeenCalledWith(initialCenter);
    await user.click(screen.getByRole("button", { name: "次へ" }));
    expect(moveStreetView).toHaveBeenCalledWith(points[1]);
  });

  it("保存中は地点操作を無効にし、上部UIのEnterを地図のショートカットに流さない", async () => {
    const user = userEvent.setup();
    const onTogglePoint = vi.fn();
    const props = {
      initialCenter,
      path: null,
      markers,
      topRight: <button>更新</button>,
    };
    const { rerender } = render(
      <RouteMap
        {...props}
        editing={{ points, disabled: false, onTogglePoint }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "下見位置を選択" }));
    fireEvent.keyDown(screen.getByRole("button", { name: "更新" }), {
      key: "Enter",
    });
    expect(onTogglePoint).not.toHaveBeenCalled();
    rerender(
      <RouteMap
        {...props}
        editing={{ points, disabled: true, onTogglePoint }}
      />,
    );
    expect(screen.getByRole("button", { name: "地点を削除" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "次へ" })).toBeDisabled();
  });
});
