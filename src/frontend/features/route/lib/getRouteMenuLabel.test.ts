import { describe, expect, it } from "vitest";
import { getRouteMenuLabel } from "./getRouteMenuLabel";

describe("getRouteMenuLabel", () => {
  it("取得中は距離より計測中の表示を優先する", () => {
    expect(getRouteMenuLabel(5200, true)).toBe("MEASURING");
  });
  it("距離をkmへ変換して表示する", () => {
    expect(getRouteMenuLabel(5200, false)).toBe("5.2 km");
  });
  it.each([null, undefined, 0])(
    "距離がない場合はMENUを表示する",
    (distance) => {
      expect(getRouteMenuLabel(distance, false)).toBe("MENU");
    },
  );
});
