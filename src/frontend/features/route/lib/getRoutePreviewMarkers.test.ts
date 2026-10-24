import { describe, expect, it } from "vitest";
import { getRoutePreviewMarkers } from "./getRoutePreviewMarkers";

const start = { lat: 35, lng: 135 };
const goal = { lat: 36, lng: 136 };

describe("getRoutePreviewMarkers", () => {
  it("始終点が異なる場合はS・Gをそれぞれの位置に表示する", () => {
    expect(getRoutePreviewMarkers(start, goal)).toEqual([
      {
        id: "start",
        position: start,
        label: "S",
        title: "スタート",
        color: "#15803d",
      },
      {
        id: "goal",
        position: goal,
        label: "G",
        title: "ゴール",
        color: "#b91c1c",
      },
    ]);
  });

  it("同じ座標の始終点はS/Gの1つにまとめる", () => {
    expect(getRoutePreviewMarkers(start, { ...start })).toEqual([
      {
        id: "start",
        position: start,
        label: "S/G",
        title: "スタート／ゴール",
        color: "#1d4ed8",
      },
    ]);
  });

  it.each([
    [undefined, undefined],
    [start, undefined],
    [undefined, goal],
  ])("始点または終点がなければマーカーを生成しない", (from, to) => {
    expect(getRoutePreviewMarkers(from, to)).toEqual([]);
  });
});
