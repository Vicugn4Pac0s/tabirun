import "server-only";

import { TRPCError } from "@trpc/server";
import type { db } from "~/server/db";
import type { RouteCreateInput, RouteUpdateInput } from "~/shared/schemas";
import {
  CLEARED_DIRECTION,
  deleteOwnedRoute,
  findOwnedRouteForUpdate,
  findUserRoutes,
  insertOwnedRoute,
  toRoute,
  updateOwnedRoute,
} from "./data";
import { ensureRouteDirection } from "./ensureRouteDirection";
import { getRoutePointsHash } from "./routeDirectionCache";

export async function getRouteDetail(
  database: typeof db,
  userId: string,
  id: number,
) {
  return database.transaction(async (tx) => {
    const row = await findOwnedRouteForUpdate(tx, userId, id);
    if (!row) throw new TRPCError({ code: "NOT_FOUND" });
    const route = toRoute(row);
    const directionResult = await ensureRouteDirection(tx, userId, route);
    return {
      id: route.id,
      title: route.title,
      points: route.points,
      createdById: route.createdById,
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
      ...directionResult,
    };
  });
}

export async function createRoute(
  database: typeof db,
  userId: string,
  input: RouteCreateInput,
): Promise<void> {
  await database.transaction(async (tx) => {
    const [created] = await insertOwnedRoute(tx, userId, input);
    if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    // 計算に失敗しても登録地点は保存し、詳細取得時に再試行できるようにする。
    await ensureRouteDirection(tx, userId, toRoute(created));
  });
}

export async function updateRoute(
  database: typeof db,
  userId: string,
  input: RouteUpdateInput,
): Promise<void> {
  await database.transaction(async (tx) => {
    const row = await findOwnedRouteForUpdate(tx, userId, input.id);
    if (!row) throw new TRPCError({ code: "NOT_FOUND" });
    const existing = toRoute(row);
    const pointsChanged =
      getRoutePointsHash(existing.points) !== getRoutePointsHash(input.points);
    const changes = {
      title: input.title,
      points: JSON.stringify(input.points),
      updatedAt: new Date(),
      ...(pointsChanged ? CLEARED_DIRECTION : {}),
    };
    const updated = await updateOwnedRoute(tx, userId, input.id, changes);
    // FOR UPDATEで取得済みなので通常は起きないが、念のための保険。
    if (updated.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
    if (pointsChanged)
      await ensureRouteDirection(tx, userId, {
        ...existing,
        ...changes,
        points: input.points,
      });
  });
}

export async function deleteRoute(
  database: typeof db,
  userId: string,
  id: number,
): Promise<void> {
  const deleted = await deleteOwnedRoute(database, userId, id);
  if (deleted.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
}

export function getUserRoutes(database: typeof db, userId: string) {
  return findUserRoutes(database, userId);
}
