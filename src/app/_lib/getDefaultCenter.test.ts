import { describe, expect, it } from "vitest";

import { getDefaultCenter } from "~/app/_lib/getDefaultCenter";

const fallbackCenter = { lat: 34.682952, lng: 135.532147 };

describe("getDefaultCenter", () => {
  it("ホーム地点が設定されている場合はその座標を返す", () => {
    expect(
      getDefaultCenter(
        { homeLat: 35.681236, homeLng: 139.767125 },
        fallbackCenter,
      ),
    ).toEqual({ lat: 35.681236, lng: 139.767125 });
  });

  it.each([
    [null],
    [undefined],
    [{ homeLat: null, homeLng: null }],
    [{ homeLat: 35.681236, homeLng: null }],
    [{ homeLat: null, homeLng: 139.767125 }],
  ])("ホーム地点が不足している場合はフォールバック座標を返す", (user) => {
    expect(getDefaultCenter(user, fallbackCenter)).toEqual(fallbackCenter);
  });
});
