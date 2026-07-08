import { describe, expect, it } from "vitest";
import {
  routeCreateSchema,
  routeDeleteSchema,
  routePointsSchema,
  routeUpdateSchema,
  userInitialProfileSchema,
  userProfileUpdateSchema,
} from "~/shared/schemas";

describe("route schemas", () => {
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

describe("user profile schemas", () => {
  it("1項目以上を含むプロフィール更新入力を受け入れる", () => {
    const result = userProfileUpdateSchema.safeParse({
      gender: "male",
    });

    expect(result.success).toBe(true);
  });

  it("空のプロフィール更新入力を拒否する", () => {
    const result = userProfileUpdateSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("At least one field is required");
  });

  it("正の身長と体重を持つ初期プロフィール入力を受け入れる", () => {
    const result = userInitialProfileSchema.safeParse({
      birthDate: "1990-01-01",
      gender: "male",
      pace: "5:30",
      height: 170,
      weight: 60,
    });

    expect(result.success).toBe(true);
  });

  it("身長が 0 の初期プロフィール入力を拒否する", () => {
    const result = userInitialProfileSchema.safeParse({
      birthDate: "1990-01-01",
      gender: "male",
      pace: "5:30",
      height: 0,
      weight: 60,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("身長は1以上で入力してください");
  });

  it("生年月日が空の初期プロフィール入力を拒否する", () => {
    const result = userInitialProfileSchema.safeParse({
      birthDate: "",
      gender: "male",
      pace: "5:30",
      height: 170,
      weight: 60,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("生年月日を入力してください");
  });
});
