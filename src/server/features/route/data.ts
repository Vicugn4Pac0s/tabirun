import "server-only";

import { and, eq, sql } from "drizzle-orm";
import type { db } from "~/server/db";
import { routes } from "~/server/db/schema";
import { routePointsSchema, type RouteCreateInput } from "~/shared/schemas";
import type { SavedRouteDirection } from "./routeDirectionCache";

export const CLEARED_DIRECTION = {
  encodedPolyline: null,
  distanceMeters: null,
  duration: null,
  directionSource: null,
  directionCalculatedAt: null,
  directionPointsHash: null,
} as const;

export async function findOwnedRouteForUpdate(
  tx: Pick<typeof db, "select">,
  userId: string,
  id: number,
) {
  const [row] = await tx
    .select()
    .from(routes)
    .where(and(eq(routes.id, id), eq(routes.createdById, userId)))
    .for("update");
  return row;
}

export function insertOwnedRoute(
  tx: Pick<typeof db, "insert">,
  userId: string,
  input: RouteCreateInput,
) {
  return tx
    .insert(routes)
    .values({
      title: input.title,
      points: JSON.stringify(input.points),
      createdById: userId,
    })
    .returning();
}

export function updateOwnedRoute(
  tx: Pick<typeof db, "update">,
  userId: string,
  id: number,
  changes: Partial<typeof routes.$inferInsert>,
) {
  return tx
    .update(routes)
    .set(changes)
    .where(and(eq(routes.id, id), eq(routes.createdById, userId)))
    .returning({ id: routes.id });
}

export function deleteOwnedRoute(
  database: Pick<typeof db, "delete">,
  userId: string,
  id: number,
) {
  return database
    .delete(routes)
    .where(and(eq(routes.id, id), eq(routes.createdById, userId)))
    .returning({ id: routes.id });
}

export function findUserRoutes(
  database: Pick<typeof db, "select">,
  userId: string,
) {
  return database
    .select({
      id: routes.id,
      title: routes.title,
      createdById: routes.createdById,
      createdAt: routes.createdAt,
      updatedAt: routes.updatedAt,
    })
    .from(routes)
    .where(eq(routes.createdById, userId));
}

export function saveOwnedRouteDirection(
  tx: Pick<typeof db, "update">,
  userId: string,
  id: number,
  result: SavedRouteDirection,
) {
  return tx
    .update(routes)
    .set({
      encodedPolyline: result.encodedPolyline,
      distanceMeters: result.distanceMeters,
      duration: result.duration,
      directionSource: result.directionSource,
      directionCalculatedAt: result.directionCalculatedAt,
      directionPointsHash: result.directionPointsHash,
      // 閲覧時の再取得で、一覧の「更新日」を書き換えない。
      updatedAt: sql`${routes.updatedAt}`,
    })
    .where(and(eq(routes.id, id), eq(routes.createdById, userId)))
    .returning({ id: routes.id });
}

export function toRoute(row: typeof routes.$inferSelect) {
  return { ...row, points: routePointsSchema.parse(JSON.parse(row.points)) };
}
