import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  userInitialProfileSchema,
  userProfileUpdateSchema,
} from "~/shared/schemas";

describe("user profile schemas", () => {
  const initialProfile = {
    birthDate: "1990-01-01",
    gender: "male",
    pace: "5:30",
    height: 170,
    weight: 60,
  };

  it.each(["male", "female", "other", "prefer_not_to_say"])(
    "性別 %s を初回設定と更新で受け入れる",
    (gender) => {
      expect(
        userInitialProfileSchema.safeParse({ ...initialProfile, gender })
          .success,
      ).toBe(true);
      expect(userProfileUpdateSchema.safeParse({ gender }).success).toBe(true);
    },
  );

  it.each(["invalid", "", "MALE", "male ", null, 1])(
    "選択肢以外の性別 %s を初回設定と更新で拒否する",
    (gender) => {
      expect(
        userInitialProfileSchema.safeParse({ ...initialProfile, gender })
          .success,
      ).toBe(false);
      expect(userProfileUpdateSchema.safeParse({ gender }).success).toBe(false);
    },
  );

  it.each([
    ["", "性別を選択してください"],
    [undefined, "性別を選択してください"],
  ])("初回設定の未選択の性別 %s に既存の案内を返す", (gender, message) => {
    const result = userInitialProfileSchema.safeParse({
      ...initialProfile,
      gender,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(message);
  });

  it("更新では性別を省略できる", () => {
    expect(userProfileUpdateSchema.safeParse({ pace: "5:30" }).success).toBe(
      true,
    );
  });

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

describe("プロフィールの入力制約と日本語エラー", () => {
  const profile = {
    birthDate: "1990-01-01",
    gender: "male",
    pace: "5:30",
    height: 170,
    weight: 60,
  };
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-15T15:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  const invalidFields = [
    {
      field: "birthDate",
      value: undefined,
      message: "生年月日を入力してください",
    },
    { field: "birthDate", value: null, message: "生年月日を入力してください" },
    { field: "birthDate", value: "", message: "生年月日を入力してください" },
    {
      field: "birthDate",
      value: "invalid",
      message: "生年月日を入力してください",
    },
    {
      field: "birthDate",
      value: "2026-02-30",
      message: "生年月日を入力してください",
    },
    {
      field: "birthDate",
      value: "1899-12-31",
      message: "生年月日は1900年1月1日以降で入力してください",
    },
    {
      field: "birthDate",
      value: "2026-11-17",
      message: "生年月日は今日以前の日付で入力してください",
    },
    { field: "gender", value: undefined, message: "性別を選択してください" },
    { field: "gender", value: null, message: "性別を選択してください" },
    { field: "gender", value: "", message: "性別を選択してください" },
    { field: "gender", value: "invalid", message: "性別を選択してください" },
    { field: "pace", value: undefined, message: "ペースを選択してください" },
    { field: "pace", value: null, message: "ペースを選択してください" },
    { field: "pace", value: "", message: "ペースを選択してください" },
    ...["abc", "5:3", "5:300", " 5:30", "5:30 ", "5: 30", "100:00"].map(
      (value) => ({
        field: "pace",
        value,
        message: "ペースは5:30の形式で入力してください",
      }),
    ),
    {
      field: "pace",
      value: "a".repeat(256),
      message: "ペースは5:30の形式で入力してください",
    },
    ...["height", "weight"].flatMap((field) => {
      const label = field === "height" ? "身長" : "体重";
      const max = field === "height" ? 250 : 300;
      return [
        { field, value: undefined, message: `${label}を入力してください` },
        ...[null, "170", NaN].map((value) => ({
          field,
          value,
          message: `${label}は数値で入力してください`,
        })),
        { field, value: 1.5, message: `${label}は整数で入力してください` },
        ...[0, -1].map((value) => ({
          field,
          value,
          message: `${label}は1以上で入力してください`,
        })),
        ...[max + 1, 1e20].map((value) => ({
          field,
          value,
          message: `${label}は${max}以下で入力してください`,
        })),
      ];
    }),
  ];

  it.each(invalidFields)(
    "初回設定の$field=$valueに日本語エラーを返す",
    ({ field, value, message }) => {
      const result = userInitialProfileSchema.safeParse({
        ...profile,
        [field]: value,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.find((issue) => issue.path[0] === field)?.message,
      ).toBe(message);
    },
  );

  it.each(invalidFields.filter(({ value }) => value !== undefined))(
    "更新の$field=$valueに日本語エラーを返す",
    ({ field, value, message }) => {
      const result = userProfileUpdateSchema.safeParse({ [field]: value });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.find((issue) => issue.path[0] === field)?.message,
      ).toBe(message);
    },
  );

  it.each([
    { birthDate: "1900-01-01" },
    { birthDate: "2026-11-16" },
    { pace: "5:30" },
    { pace: "10:00" },
    { pace: "5:99" },
    { height: 1 },
    { height: 250 },
    { weight: 1 },
    { weight: 300 },
  ])("初回設定と更新で境界値・形式を受け入れる（%j）", (fields) => {
    expect(
      userInitialProfileSchema.safeParse({ ...profile, ...fields }).success,
    ).toBe(true);
    expect(userProfileUpdateSchema.safeParse(fields).success).toBe(true);
  });

  it("初回設定で全項目未入力なら各項目に日本語の案内を返す", () => {
    const result = userInitialProfileSchema.safeParse({});
    expect(result.error?.flatten().fieldErrors).toEqual({
      birthDate: ["生年月日を入力してください"],
      gender: ["性別を選択してください"],
      pace: ["ペースを選択してください"],
      height: ["身長を入力してください"],
      weight: ["体重を入力してください"],
    });
  });

  it("更新では未指定・undefinedの項目を引き続き省略できる", () => {
    expect(
      userProfileUpdateSchema.parse({
        pace: "5:30",
        birthDate: undefined,
        gender: undefined,
        height: undefined,
        weight: undefined,
      }),
    ).toEqual({
      pace: "5:30",
      birthDate: undefined,
      gender: undefined,
      height: undefined,
      weight: undefined,
    });
  });

  it("schemaの読み込み時ではなく検証時の日本時間で今日を決める", () => {
    vi.setSystemTime(new Date("2026-11-15T14:59:59Z"));
    expect(
      userProfileUpdateSchema.safeParse({ birthDate: "2026-11-16" }).success,
    ).toBe(false);
    vi.setSystemTime(new Date("2026-11-15T15:00:00Z"));
    expect(
      userProfileUpdateSchema.safeParse({ birthDate: "2026-11-16" }).success,
    ).toBe(true);
  });
});
