import { describe, expect, it } from "vitest";
import {
  directionInputSchema,
  routeIdSchema,
  routeCreateSchema,
  routeDeleteSchema,
  routePointsSchema,
  routeUpdateSchema,
  ROUTE_POINTS_MAX,
} from "~/shared/schemas";

describe("route schemas", () => {
  it.each([
    { lat: -90.001, lng: 0 },
    { lat: 90.001, lng: 0 },
    { lat: 0, lng: -180.001 },
    { lat: 0, lng: 180.001 },
    { lat: Infinity, lng: 0 },
    { lat: -Infinity, lng: 0 },
    { lat: 0, lng: Infinity },
    { lat: 0, lng: -Infinity },
    { lat: NaN, lng: 0 },
    { lat: 0, lng: NaN },
  ])("範囲外・非有限の座標を拒否する（%j）", (point) => {
    expect(
      routePointsSchema.safeParse([point, { lat: 0, lng: 0 }]).success,
    ).toBe(false);
  });

  it.each([
    { lat: -90, lng: -180 },
    { lat: -90, lng: 180 },
    { lat: 90, lng: -180 },
    { lat: 90, lng: 180 },
  ])("境界値の座標を受け入れる（%j）", (point) => {
    expect(
      routePointsSchema.safeParse([point, { lat: 0, lng: 0 }]).success,
    ).toBe(true);
  });

  it("2点以上のルートポイントを受け入れる", () => {
    const result = routePointsSchema.safeParse([
      { lat: 35.0, lng: 139.0 },
      { lat: 35.1, lng: 139.1 },
    ]);

    expect(result.success).toBe(true);
  });

  it("1点のみのルートポイントを拒否する", () => {
    const result = routePointsSchema.safeParse([{ lat: 35.0, lng: 139.0 }]);

    expect(result.success).toBe(false);
  });

  it(`${ROUTE_POINTS_MAX + 1} 点以上のルートポイントを拒否する`, () => {
    const points = Array.from({ length: ROUTE_POINTS_MAX + 1 }, (_, index) => ({
      lat: 35 + index * 0.0001,
      lng: 139,
    }));

    const result = routePointsSchema.safeParse(points);

    expect(result.success).toBe(false);
  });

  it(`${ROUTE_POINTS_MAX} 点のルートポイントを受け入れる`, () => {
    const points = Array.from({ length: ROUTE_POINTS_MAX }, (_, index) => ({
      lat: 35 + index * 0.0001,
      lng: 139,
    }));

    const result = routePointsSchema.safeParse(points);

    expect(result.success).toBe(true);
  });

  it("タイトルとポイントを含むルート作成入力を受け入れる", () => {
    const result = routeCreateSchema.safeParse({
      title: "Morning Run",
      points: [
        { lat: 35.0, lng: 139.0 },
        { lat: 35.1, lng: 139.1 },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("ルート作成時に名前の前後の空白を除去する", () => {
    const result = routeCreateSchema.parse({
      title: " Morning Run ",
      points: [
        { lat: 35.0, lng: 139.0 },
        { lat: 35.1, lng: 139.1 },
      ],
    });

    expect(result.title).toBe("Morning Run");
  });

  it("空白のみのルート名を作成・更新で拒否する", () => {
    const input = {
      title: "   ",
      points: [
        { lat: 35.0, lng: 139.0 },
        { lat: 35.1, lng: 139.1 },
      ],
    };

    expect(routeCreateSchema.safeParse(input).success).toBe(false);
    expect(routeUpdateSchema.safeParse({ ...input, id: 1 }).success).toBe(
      false,
    );
  });

  it("ルート名はDBの上限である256文字まで受け入れる", () => {
    const input = {
      title: "あ".repeat(256),
      points: [
        { lat: 35.0, lng: 139.0 },
        { lat: 35.1, lng: 139.1 },
      ],
    };

    expect(routeCreateSchema.safeParse(input).success).toBe(true);
    expect(
      routeCreateSchema.safeParse({ ...input, title: "あ".repeat(257) })
        .success,
    ).toBe(false);
  });

  it("正の整数 id を持つルート更新入力を受け入れる", () => {
    const result = routeUpdateSchema.safeParse({
      id: 1,
      title: "Updated Run",
      points: [
        { lat: 35.0, lng: 139.0 },
        { lat: 35.1, lng: 139.1 },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("0 以下の id を持つルート更新入力を拒否する", () => {
    const result = routeUpdateSchema.safeParse({
      id: 0,
      title: "Updated Run",
      points: [
        { lat: 35.0, lng: 139.0 },
        { lat: 35.1, lng: 139.1 },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("正の整数 id を持つルート削除入力を受け入れる", () => {
    const result = routeDeleteSchema.safeParse({ id: 1 });

    expect(result.success).toBe(true);
  });

  it("負の id を持つルート削除入力を拒否する", () => {
    const result = routeDeleteSchema.safeParse({ id: -1 });

    expect(result.success).toBe(false);
  });
});

describe("経路取得の共有入力schema", () => {
  const points = [
    { lat: 35, lng: 139 },
    { lat: 36, lng: 140 },
  ];

  it("地点だけの入力を受け入れる", () => {
    expect(directionInputSchema.parse({ routePoints: points })).toEqual({
      routePoints: points,
    });
  });

  it.each(["DRIVE", "BICYCLE", "WALK", "invalid", null])(
    "travelMode=%sを未知のキーとして除去する",
    (travelMode) => {
      expect(
        directionInputSchema.parse({ routePoints: points, travelMode }),
      ).toEqual({ routePoints: points });
    },
  );

  it.each([
    undefined,
    [],
    [{ lat: 35, lng: 139 }],
    [
      { lat: 91, lng: 139 },
      { lat: 36, lng: 140 },
    ],
    [
      { lat: 35, lng: Infinity },
      { lat: 36, lng: 140 },
    ],
    Array.from({ length: ROUTE_POINTS_MAX + 1 }, () => ({ lat: 35, lng: 139 })),
  ])("既存の地点制約に違反する入力を拒否する（%j）", (routePoints) => {
    expect(directionInputSchema.safeParse({ routePoints }).success).toBe(false);
  });
});

describe("詳細取得・削除の共有ID schema", () => {
  it.each([undefined, null, "1", 0, -1, 1.5, Infinity, NaN])(
    "不正なIDを拒否する（%s）",
    (id) => {
      expect(routeIdSchema.safeParse({ id }).success).toBe(false);
      expect(routeDeleteSchema.safeParse({ id }).success).toBe(false);
    },
  );

  it("正の整数IDを受け入れ、未知のキーを除去する", () => {
    expect(routeIdSchema.parse({ id: 1, extra: "ignored" })).toEqual({ id: 1 });
    expect(routeDeleteSchema.parse({ id: 1, extra: "ignored" })).toEqual({
      id: 1,
    });
  });
});
