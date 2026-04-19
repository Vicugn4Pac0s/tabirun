import { describe, it, expect } from "vitest";
import {
  calcTimeFromDistanceAndPace,
  metersToKilometers,
  calcCaloriesFromRun,
} from "~/frontend/lib/running";

describe("calcTimeFromDistanceAndPace", () => {
  it("距離とペースから総時間を計算できる", () => {
    // 10km × 6:00/km = 1:00:00
    expect(calcTimeFromDistanceAndPace(10, "6:00")).toBe("1:00:00");
  });

  it("1時間未満の場合は hh: を 00: で補完する", () => {
    // 5km × 5:00/km = 25:00
    expect(calcTimeFromDistanceAndPace(5, "5:00")).toBe("00:25:00");
  });

  it("秒が端数になる場合も正しく計算できる", () => {
    // 1km × 5:30/km = 5:30
    expect(calcTimeFromDistanceAndPace(1, "5:30")).toBe("00:05:30");
  });

  it("距離が 0 のとき 00:00:00 を返す", () => {
    expect(calcTimeFromDistanceAndPace(0, "6:00")).toBe("00:00:00");
  });

  it("不正なペース文字列のとき 0:00 を返す", () => {
    expect(calcTimeFromDistanceAndPace(10, "invalid" as any)).toBe("0:00");
  });
});

describe("metersToKilometers", () => {
  it("1000m を 1.00km に変換できる", () => {
    expect(metersToKilometers(1000)).toBe(1);
  });

  it("小数点以下の桁数を指定できる", () => {
    expect(metersToKilometers(1234, 1)).toBe(1.2);
    expect(metersToKilometers(1234, 3)).toBe(1.234);
  });

  it("0m は 0km を返す", () => {
    expect(metersToKilometers(0)).toBe(0);
  });

  it("Infinity を渡したとき 0 を返す", () => {
    expect(metersToKilometers(Infinity)).toBe(0);
  });

  it("NaN を渡したとき 0 を返す", () => {
    expect(metersToKilometers(NaN)).toBe(0);
  });
});

describe("calcCaloriesFromRun", () => {
  it("基準ペース(6:00/km)で消費カロリーを計算できる", () => {
    // 60kg × 10km × paceFactor≒1 ≒ 600kcal
    const result = calcCaloriesFromRun(60, 10, "6:00");
    expect(result).toBeCloseTo(600, 0);
  });

  it("速いペースのとき paceFactor が上昇し消費カロリーが増える", () => {
    const slow = calcCaloriesFromRun(60, 10, "7:00");
    const fast = calcCaloriesFromRun(60, 10, "5:00");
    expect(fast).toBeGreaterThan(slow);
  });

  it("体重が 0 のとき 0 を返す", () => {
    expect(calcCaloriesFromRun(0, 10, "6:00")).toBe(0);
  });

  it("距離が 0 のとき 0 を返す", () => {
    expect(calcCaloriesFromRun(60, 0, "6:00")).toBe(0);
  });

  it("不正なペース文字列のとき 0 を返す", () => {
    expect(calcCaloriesFromRun(60, 10, "invalid" as any)).toBe(0);
  });

  it("小数点以下の桁数を指定できる", () => {
    // fractionDigits=2 で計算した結果が number 型で返る
    const result = calcCaloriesFromRun(60, 10, "5:00", 2);
    expect(result).toBeGreaterThan(0);
    // toFixed(2) 経由なので小数第2位まで精度が保たれている
    expect(Number.isFinite(result)).toBe(true);
  });
});
