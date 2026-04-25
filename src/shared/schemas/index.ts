import { z } from "zod";

export const routeCreateSchema = z.object({
  title: z.string().min(1),
  points: z.array(z.object({ lat: z.number(), lng: z.number() })).min(2),
  kilometers: z.number().min(0),
});

export type RouteCreateInput = z.infer<typeof routeCreateSchema>;

export const userProfileUpdateSchema = z
  .object({
    birthDate: z.string().date().optional(),
    gender: z.string().max(50).optional(),
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
  gender: z.string().min(1, "性別を選択してください").max(50),
  pace: z.string().min(1, "ペースを選択してください").max(255),
  height: z.number().int().positive("身長は1以上で入力してください"),
  weight: z.number().int().positive("体重は1以上で入力してください"),
});

export type UserInitialProfileInput = z.infer<typeof userInitialProfileSchema>;
