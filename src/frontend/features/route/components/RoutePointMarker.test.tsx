import { cleanup, render } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type AdvancedMarker from "~/frontend/features/googlemap/components/AdvancedMarker";
import RoutePointMarker from "./RoutePointMarker";

const { renderMarker } = vi.hoisted(() => ({
  renderMarker: vi.fn<(props: ComponentProps<typeof AdvancedMarker>) => null>(
    () => null,
  ),
}));
vi.mock("~/frontend/features/googlemap/components/AdvancedMarker", () => ({
  default: renderMarker,
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RoutePointMarker", () => {
  it("更新では生成関数を維持し、同じDOMのラベルと色を更新する", () => {
    const props = { map: null, position: { lat: 35, lng: 135 }, title: "地点" };
    const { rerender } = render(
      <RoutePointMarker {...props} label="1" color="red" />,
    );
    const initial = renderMarker.mock.lastCall?.[0];
    if (!initial) throw new Error("マーカーが描画されていません");
    const content = initial.createContent();
    initial.updateContent(content);
    expect(content.textContent).toBe("1");
    expect(content.style.backgroundColor).toBe("red");

    rerender(<RoutePointMarker {...props} label="2" color="blue" />);
    const latest = renderMarker.mock.lastCall?.[0];
    expect(latest?.createContent).toBe(initial.createContent);
    latest?.updateContent(content);
    expect(content.textContent).toBe("2");
    expect(content.style.backgroundColor).toBe("blue");
  });

  it.each([
    ["S", "スタート"],
    ["G", "ゴール"],
    ["S/G", "スタート／ゴール"],
    ["2", "地点 2"],
  ] as const)("%sは略称と読み上げ用の名前を持つ", (label, title) => {
    const position = { lat: 35, lng: 135 };
    render(
      <RoutePointMarker
        map={null}
        position={position}
        label={label}
        title={title}
      />,
    );
    const props = renderMarker.mock.lastCall?.[0];
    if (!props) throw new Error("マーカーが描画されていません");
    const content = props.createContent();
    props.updateContent(content);
    expect(content.textContent).toBe(label);
    expect(content.style.backgroundColor).toBe("rgba(0, 0, 0, 0.6)");
    expect(props.options).toEqual({ position, title });
  });
});
