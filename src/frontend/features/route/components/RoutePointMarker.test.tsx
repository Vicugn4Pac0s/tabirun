import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type AdvancedMarker from "~/frontend/features/googlemap/components/AdvancedMarker";
import RoutePointMarker from "./RoutePointMarker";

const { renderMarker } = vi.hoisted(() => ({
  renderMarker: vi.fn((props: ComponentProps<typeof AdvancedMarker>) => (
    <div role="img" aria-label={props.title}>
      {props.children}
    </div>
  )),
}));
vi.mock("~/frontend/features/googlemap/components/AdvancedMarker", () => ({
  default: renderMarker,
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RoutePointMarker", () => {
  it("再描画では同じDOMのラベルと色を更新する", () => {
    const props = { map: null, position: { lat: 35, lng: 135 }, title: "地点" };
    const { rerender } = render(
      <RoutePointMarker {...props} label="1" color="red" />,
    );
    const marker = screen.getByRole("img", { name: "地点" });
    const content = marker.firstElementChild;
    expect(content).toHaveTextContent("1");
    expect(content).toHaveStyle({ backgroundColor: "rgb(255, 0, 0)" });
    rerender(<RoutePointMarker {...props} label="2" color="blue" />);
    expect(marker.firstElementChild).toBe(content);
    expect(content).toHaveTextContent("2");
    expect(content).toHaveStyle({ backgroundColor: "rgb(0, 0, 255)" });
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
    const marker = screen.getByRole("img", { name: title });
    expect(marker).toHaveTextContent(label);
    expect(marker.firstElementChild?.getAttribute("style")).toContain(
      "background-color: var(--map-marker-via)",
    );
    expect(renderMarker.mock.lastCall?.[0]).toMatchObject({ position, title });
  });
});
