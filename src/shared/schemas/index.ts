import { z } from "zod";

const homeCoordinateSchema = z.number().finite();

const homeLocationSchema = z.object({
  homeLat: homeCoordinateSchema.min(-90).max(90).nullable().optional(),
  homeLng: homeCoordinateSchema.min(-180).max(180).nullable().optional(),
});

export const routePointsSchema = z
  .array(z.object({ lat: z.number(), lng: z.number() }))
  .min(2);

export const routeCreateSchema = z.object({
  title: z.string().min(1),
  points: routePointsSchema,
});

export type RouteCreateInput = z.infer<typeof routeCreateSchema>;

export const routeUpdateSchema = routeCreateSchema.extend({
  id: z.number().int().positive(),
});

export type RouteUpdateInput = z.infer<typeof routeUpdateSchema>;

export const routeDeleteSchema = z.object({
  id: z.number().int().positive(),
});

export type RouteDeleteInput = z.infer<typeof routeDeleteSchema>;

export const userProfileUpdateSchema = z
  .object({
    birthDate: z.string().date().optional(),
    gender: z.string().max(50).optional(),
    pace: z.string().max(255).optional(),
    height: z.number().int().positive().optional(),
    weight: z.number().int().positive().optional(),
  })
  .merge(homeLocationSchema)
  .superRefine((value, ctx) => {
    const hasLat = value.homeLat != null;
    const hasLng = value.homeLng != null;

    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasLat ? ["homeLng"] : ["homeLat"],
        message: "ホーム地点の緯度・経度はセットで入力してください",
      });
    }
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
