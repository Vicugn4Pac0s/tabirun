import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RoutePointMarker from "./RoutePointMarker";

vi.mock("~/frontend/features/googlemap/components/AdvancedMarker", () => ({
  default: ({
    content,
    options,
  }: {
    content: HTMLElement;
    options: { title: string };
  }) => (
    <span role="img" aria-label={options.title}>
      {content.textContent}
    </span>
  ),
}));
afterEach(cleanup);

describe("RoutePointMarker", () => {
  it.each([
    ["S", "スタート"],
    ["G", "ゴール"],
    ["S/G", "スタート／ゴール"],
  ] as const)("%sは略称と読み上げ用の名前を持つ", (label, title) => {
    render(
      <RoutePointMarker
        map={null}
        position={{ lat: 35, lng: 135 }}
        label={label}
        title={title}
      />,
    );
    expect(screen.getByRole("img", { name: title })).toHaveTextContent(label);
  });

  it("通常の地点は既存の番号表示を維持する", () => {
    render(
      <RoutePointMarker
        map={null}
        position={{ lat: 35, lng: 135 }}
        label="2"
        title="地点 2"
      />,
    );
    expect(screen.getByRole("img", { name: "地点 2" })).toHaveTextContent("2");
  });
});
