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
  saveOwnedRouteDirection,
  toRoute,
  updateOwnedRoute,
} from "~/server/features/route/repository";
import {
  getRoutePointsHash,
  getReusableRouteDirection,
  createStraightLineDirection,
  toSavedGoogleRouteDirection,
  type SavedRouteDirection,
} from "~/server/features/direction/domain";
import { getDirection } from "~/server/features/direction/service";
import { hasQuotaRemaining } from "~/server/quota/service";
import type { routes } from "~/server/db/schema";

type RouteDirectionDb = Pick<typeof db, "query" | "insert" | "update">;
type RouteForDirection = Omit<typeof routes.$inferSelect, "points"> & {
  points: RouteCreateInput["points"];
};

/**
 * 所有ルートの詳細と経路を返し、対象がなければNOT_FOUNDを投げる。
 * 同じトランザクションの行ロックを保持したまま経路を計算・保存する場合がある。
 */
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

/**
 * ルートを登録し、経路計算・保存までを1つのトランザクションで行う。
 * 経路取得失敗でも地点は保存する。登録行が返らなければINTERNAL_SERVER_ERROR。
 */
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

/**
 * 所有ルートを更新し、地点が変わった場合だけ経路を無効化・再計算する。
 * 取得から計算まで同じトランザクションでロックを保持する。対象なし・更新0件はNOT_FOUND。
 * 経路取得失敗でも変更地点は保存する。
 */
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

/**
 * 所有ルートを削除し、対象がなければNOT_FOUNDを投げる。
 * 他人のルートも対象なしと同じ扱いにする。
 */
export async function deleteRoute(
  database: typeof db,
  userId: string,
  id: number,
): Promise<void> {
  const deleted = await deleteOwnedRoute(database, userId, id);
  if (deleted.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
}

/**
 * 指定ユーザーのルート一覧を返す。未登録なら空配列を返す。
 */
export function getUserRoutes(database: typeof db, userId: string) {
  return findUserRoutes(database, userId);
}

/**
 * 経路を再利用または計算・保存する。残数不足は直線、通信・保存値検証の失敗はエラーコードで返す。
 * 呼出側で取得・ロック（新規作成はINSERT）した行と同じトランザクションを使う。
 * 所有者不一致・保存0件はNOT_FOUND。入力地点が不正な場合も例外になる。
 */
export async function ensureRouteDirection(
  tx: RouteDirectionDb,
  userId: string,
  route: RouteForDirection,
): Promise<
  | { direction: SavedRouteDirection; directionErrorCode: null }
  | { direction: null; directionErrorCode: "INTERNAL_SERVER_ERROR" }
> {
  if (route.createdById !== userId) throw new TRPCError({ code: "NOT_FOUND" });
  const points = route.points;
  const reusable = getReusableRouteDirection(route, points, new Date());
  if (reusable) return { direction: reusable, directionErrorCode: null };

  const quotaCheckedAt = new Date();
  const quotaRemaining = await hasQuotaRemaining(tx, userId, "direction");

  const pointsHash = getRoutePointsHash(points);
  let result: SavedRouteDirection;
  if (!quotaRemaining) {
    result = createStraightLineDirection(points, pointsHash, quotaCheckedAt);
  } else {
    const direction = await getDirection(
      tx,
      userId,
      { routePoints: points },
      () => null,
    );
    if (!direction) {
      return { direction: null, directionErrorCode: "INTERNAL_SERVER_ERROR" };
    }
    const validated = toSavedGoogleRouteDirection(
      direction,
      points,
      pointsHash,
      new Date(),
    );
    if (!validated) {
      return { direction: null, directionErrorCode: "INTERNAL_SERVER_ERROR" };
    }
    result = validated;
  }

  const updated = await saveOwnedRouteDirection(tx, userId, route.id, result);
  if (updated.length === 0) throw new TRPCError({ code: "NOT_FOUND" });

  return { direction: result, directionErrorCode: null };
}
