import { z } from "zod";

/** 出発・到着を含む地点数の上限（Google Routes APIの中継地点は25個まで） */
export const ROUTE_POINTS_MAX = 27;

export const routePointsSchema = z
  .array(
    z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
  )
  .min(2)
  .max(ROUTE_POINTS_MAX);

export const routeIdSchema = z.object({
  id: z.number().int().positive(),
});

/** URLでは先頭ゼロや指数表記を許可せず、正確に扱える整数だけを受け入れる。 */
export const routeIdParamSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(routeIdSchema.shape.id);

const routeTitleSchema = z
  .string()
  .trim()
  .min(1, "ルート名を入力してください。")
  .max(256, "ルート名は256文字以内で入力してください。");

export const routeCreateDraftSchema = z.object({
  points: routePointsSchema,
});
export type RouteCreateDraftInput = z.infer<typeof routeCreateDraftSchema>;

export const routeUpdatePointsSchema = routeCreateDraftSchema.extend(
  routeIdSchema.shape,
);
export type RouteUpdatePointsInput = z.infer<typeof routeUpdatePointsSchema>;

export const routeUpdateDetailsSchema = routeIdSchema.extend({
  title: routeTitleSchema,
});
export type RouteUpdateDetailsInput = z.infer<typeof routeUpdateDetailsSchema>;

export const routeDeleteSchema = routeIdSchema;

export type RouteDeleteInput = z.infer<typeof routeDeleteSchema>;

export const directionInputSchema = z.object({
  routePoints: routePointsSchema,
});

export type DirectionInput = z.infer<typeof directionInputSchema>;

const snapshotFields = {
  directionCalculatedAt: z.date(),
  directionPointsHash: z.string().regex(/^[a-f0-9]{64}$/),
};

export const routeDirectionSnapshotSchema = z.discriminatedUnion(
  "directionSource",
  [
    z.object({
      ...snapshotFields,
      directionSource: z.literal("routes_api"),
      encodedPolyline: z.string().min(1),
      distanceMeters: z.number().int().nonnegative(),
      duration: z.string().regex(/^\d+(?:\.\d{1,9})?s$/),
    }),
    z.object({
      ...snapshotFields,
      directionSource: z.literal("straight_line"),
      encodedPolyline: z.null(),
      distanceMeters: z.null(),
      duration: z.null(),
    }),
  ],
);

export type RouteDirectionSnapshot = z.infer<
  typeof routeDirectionSnapshotSchema
>;
