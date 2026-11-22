import { z } from "zod";

export const GENDER_VALUES = [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
] as const;

export const genderSchema = z.enum(GENDER_VALUES, {
  error: "性別を選択してください",
});

export const userInitialProfileSchema = z.object({
  birthDate: z.iso
    .date({
      error: "生年月日を入力してください",
    })
    .refine((value) => value >= "1900-01-01", {
      message: "生年月日は1900年1月1日以降で入力してください",
    })
    .refine(
      (value) => {
        // 実行環境のタイムゾーンによらず、検証時の日本時間の日付で判定する。
        const today = new Date(Date.now() + 9 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
        return value <= today;
      },
      { message: "生年月日は今日以前の日付で入力してください" },
    ),
  gender: genderSchema,
  pace: z
    .string({
      error: "ペースを選択してください",
    })
    .min(1, "ペースを選択してください")
    .regex(/^\d{1,2}:[0-5]\d$/, "ペースは5:30の形式で入力してください"),
  height: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "身長を入力してください"
          : "身長は数値で入力してください",
    })
    .positive("身長は1以上で入力してください")
    .max(250, "身長は250以下で入力してください")
    .int("身長は整数で入力してください"),
  weight: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "体重を入力してください"
          : "体重は数値で入力してください",
    })
    .positive("体重は1以上で入力してください")
    .max(300, "体重は300以下で入力してください")
    .int("体重は整数で入力してください"),
});

export const paceSchema = userInitialProfileSchema.shape.pace;

export type UserInitialProfileInput = z.infer<typeof userInitialProfileSchema>;

export const userProfileUpdateSchema = userInitialProfileSchema
  .partial()
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    {
      message: "1つ以上の項目を入力してください",
    },
  );

export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
