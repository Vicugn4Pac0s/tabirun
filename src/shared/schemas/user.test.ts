import { describe, expect, it } from "vitest";
import {
  userInitialProfileSchema,
  userProfileUpdateSchema,
} from "~/shared/schemas";

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
    expect(result.error?.issues[0]?.message).toBe(
      "At least one field is required",
    );
  });

  it.each([0, -1, 1.5])("不正な身長 %s の更新を拒否する", (height) => {
    expect(userProfileUpdateSchema.safeParse({ height }).success).toBe(false);
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
    expect(result.error?.issues[0]?.message).toBe(
      "身長は1以上で入力してください",
    );
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
