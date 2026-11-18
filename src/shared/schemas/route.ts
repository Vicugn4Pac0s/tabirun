import { z } from "zod";

/** 出発・到着を含む地点数の上限（Google Routes APIの中継地点は25個まで） */
export const ROUTE_POINTS_MAX = 27;

export const routePointsSchema = z
  .array(
    z.object({
      lat: z.number().finite().min(-90).max(90),
      lng: z.number().finite().min(-180).max(180),
    }),
  )
  .min(2)
  .max(ROUTE_POINTS_MAX);

export const directionInputSchema = z.object({
  routePoints: routePointsSchema,
});

export type DirectionInput = z.infer<typeof directionInputSchema>;

export const routeCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "ルート名を入力してください。")
    .max(256, "ルート名は256文字以内で入力してください。"),
  points: routePointsSchema,
});

export type RouteCreateInput = z.infer<typeof routeCreateSchema>;

export const routeUpdateSchema = routeCreateSchema.extend({
  id: z.number().int().positive(),
});

export type RouteUpdateInput = z.infer<typeof routeUpdateSchema>;

export const routeIdSchema = z.object({
  id: z.number().int().positive(),
});

export const routeDeleteSchema = routeIdSchema;

export type RouteDeleteInput = z.infer<typeof routeDeleteSchema>;

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
