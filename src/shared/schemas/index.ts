import { z } from "zod";

export const UNSET_PROFILE_VALUE = "unset";
export const UNSET_BIRTH_DATE_VALUE = "0000-00-00";

export const routeCreateSchema = z.object({
  title: z.string().min(1),
  points: z.array(z.object({ lat: z.number(), lng: z.number() })).min(2),
  kilometers: z.number().min(0),
});

export type RouteCreateInput = z.infer<typeof routeCreateSchema>;

export const userProfileUpdateSchema = z
  .object({
    birthDate: z
      .string()
      .date()
      .refine((value) => value !== UNSET_BIRTH_DATE_VALUE, {
        message: "birthDate is invalid",
      })
      .optional(),
    gender: z
      .string()
      .max(50)
      .refine((value) => value !== UNSET_PROFILE_VALUE, {
        message: "gender is invalid",
      })
      .optional(),
    pace: z
      .string()
      .max(255)
      .refine((value) => value !== UNSET_PROFILE_VALUE, {
        message: "pace is invalid",
      })
      .optional(),
    height: z.number().int().positive().optional(),
    weight: z.number().int().positive().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;

export const userInitialProfileSchema = z.object({
  birthDate: z
    .string()
    .date("生年月日を入力してください")
    .refine((value) => value !== UNSET_BIRTH_DATE_VALUE, {
      message: "生年月日を入力してください",
    }),
  gender: z
    .string()
    .min(1)
    .max(50)
    .refine((value) => value !== UNSET_PROFILE_VALUE, {
      message: "性別を選択してください",
    }),
  pace: z
    .string()
    .min(1)
    .max(255)
    .refine((value) => value !== UNSET_PROFILE_VALUE, {
      message: "ペースを選択してください",
    }),
  height: z.number().int().positive("身長は1以上で入力してください"),
  weight: z.number().int().positive("体重は1以上で入力してください"),
});

export type UserInitialProfileInput = z.infer<typeof userInitialProfileSchema>;

export type UserProfileForCompletionCheck = {
  birthDate: string | null | undefined;
  gender: string | null | undefined;
  pace: string | null | undefined;
  height: number | null | undefined;
  weight: number | null | undefined;
};

export const isUserProfileCompleted = ({
  birthDate,
  gender,
  pace,
  height,
  weight,
}: UserProfileForCompletionCheck) => {
  return (
    birthDate !== null &&
    birthDate !== undefined &&
    birthDate !== UNSET_BIRTH_DATE_VALUE &&
    gender !== null &&
    gender !== undefined &&
    gender !== UNSET_PROFILE_VALUE &&
    pace !== null &&
    pace !== undefined &&
    pace !== UNSET_PROFILE_VALUE &&
    height !== null &&
    height !== undefined &&
    height > 0 &&
    weight !== null &&
    weight !== undefined &&
    weight > 0
  );
};
