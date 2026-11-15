import { z } from "zod";

export const GENDER_VALUES = [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
] as const;

export const genderSchema = z.enum(GENDER_VALUES);

export const userProfileUpdateSchema = z
  .object({
    birthDate: z.string().date().optional(),
    gender: genderSchema.optional(),
    pace: z.string().max(255).optional(),
    height: z.number().int().positive().optional(),
    weight: z.number().int().positive().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;

export const userInitialProfileSchema = z.object({
  birthDate: z.string().date("生年月日を入力してください"),
  gender: z.enum(GENDER_VALUES, {
    errorMap: (_issue, context) => ({
      message:
        context.data === undefined
          ? context.defaultError
          : "性別を選択してください",
    }),
  }),
  pace: z.string().min(1, "ペースを選択してください").max(255),
  height: z.number().int().positive("身長は1以上で入力してください"),
  weight: z.number().int().positive("体重は1以上で入力してください"),
});

export type UserInitialProfileInput = z.infer<typeof userInitialProfileSchema>;
