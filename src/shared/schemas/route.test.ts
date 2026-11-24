import { describe, expect, it } from "vitest";
import {
  directionInputSchema,
  routeIdSchema,
  routeDeleteSchema,
  routePointsSchema,
  ROUTE_POINTS_MAX,
  routeCreateDraftSchema,
  routeUpdatePointsSchema,
  routeUpdateDetailsSchema,
} from "~/shared/schemas";

describe("route schemas", () => {
  it("下書き作成と地点更新は名前を要求しない", () => {
    const points = [
      { lat: 35, lng: 139 },
      { lat: 36, lng: 140 },
    ];
    expect(routeCreateDraftSchema.parse({ points })).toEqual({ points });
    expect(routeUpdatePointsSchema.parse({ id: 1, points })).toEqual({
      id: 1,
      points,
    });
  });

  it.each([1, 28])("下書き作成と地点更新で%d点を拒否する", (length) => {
    const points = Array.from({ length }, () => ({ lat: 35, lng: 139 }));
    expect(routeCreateDraftSchema.safeParse({ points }).success).toBe(false);
    expect(routeUpdatePointsSchema.safeParse({ id: 1, points }).success).toBe(
      false,
    );
  });

  it("詳細更新は地点を要求せず、名前をtrimする", () => {
    expect(routeUpdateDetailsSchema.parse({ id: 1, title: " 名前 " })).toEqual({
      id: 1,
      title: "名前",
    });
    expect(
      routeUpdateDetailsSchema.safeParse({ id: 1, title: "a".repeat(256) })
        .success,
    ).toBe(true);
  });

  it.each(["", "   ", "a".repeat(257)])(
    "詳細更新で不正な名前を拒否する",
    (title) => {
      expect(routeUpdateDetailsSchema.safeParse({ id: 1, title }).success).toBe(
        false,
      );
    },
  );

  it.each([0, -1, 1.5])("分割更新で不正なID %dを拒否する", (id) => {
    expect(
      routeUpdateDetailsSchema.safeParse({ id, title: "名前" }).success,
    ).toBe(false);
    expect(
      routeUpdatePointsSchema.safeParse({
        id,
        points: [
          { lat: 0, lng: 0 },
          { lat: 1, lng: 1 },
        ],
      }).success,
    ).toBe(false);
  });
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

  it("名前は日本語でも256文字まで受け入れる", () => {
    expect(
      routeUpdateDetailsSchema.safeParse({ id: 1, title: "あ".repeat(256) })
        .success,
    ).toBe(true);
    expect(
      routeUpdateDetailsSchema.safeParse({ id: 1, title: "あ".repeat(257) })
        .success,
    ).toBe(false);
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
