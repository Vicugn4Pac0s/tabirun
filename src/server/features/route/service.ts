import "server-only";

import { TRPCError } from "@trpc/server";
import type { db } from "~/server/db";
import type {
  RouteCreateInput,
  RouteCreateDraftInput,
  RouteUpdatePointsInput,
  RouteUpdateDetailsInput,
  RouteUpdateInput,
} from "~/shared/schemas";
import {
  CLEARED_DIRECTION,
  findUserRoutes,
  findUserDrafts,
  findOwnedRouteForUpdate,
  insertOwnedRoute,
  updateOwnedRoute,
  deleteOwnedRoute,
  saveOwnedRouteDirection,
  toRoute,
} from "~/server/features/route/repository";
import {
  getRoutePointsHash,
  getReusableRouteDirection,
  createStraightLineDirection,
  toSavedGoogleRouteDirection,
  type SavedRouteDirection,
} from "~/server/features/direction/domain";
import { tryGetDirection } from "~/server/features/direction/service";
import { hasQuotaRemaining } from "~/server/quota/service";
import type { routes } from "~/server/db/schema";

type RouteDirectionDb = Pick<typeof db, "query" | "insert" | "update">;
type RouteForDirection = Omit<typeof routes.$inferSelect, "points"> & {
  points: RouteCreateInput["points"];
};

/**
 * 指定ユーザーの完了済みルート一覧を返す。未登録なら空配列を返す。
 */
export function getUserRoutes(database: typeof db, userId: string) {
  return findUserRoutes(database, userId);
}

/** 指定ユーザーの下書き一覧を返す。未登録なら空配列を返す。 */
export function getUserDrafts(database: typeof db, userId: string) {
  return findUserDrafts(database, userId);
}

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
      status: route.status,
      points: route.points,
      createdById: route.createdById,
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
      ...directionResult,
    };
  });
}

/** 地点を下書きとして登録し、経路を計算・保存してIDを返す。経路取得失敗でも地点は保存する。 */
export async function createRouteDraft(
  database: typeof db,
  userId: string,
  input: RouteCreateDraftInput,
) {
  return database.transaction(async (tx) => {
    const date = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const [created] = await insertOwnedRoute(tx, userId, {
      title: `${date}のルート`,
      points: input.points,
      status: "draft",
    });
    if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await ensureRouteDirection(tx, userId, toRoute(created));
    return { id: created.id };
  });
}

/** 所有ルートの地点だけを更新する。変更時は経路を再計算し、失敗しても地点は保存する。 */
export async function updateRoutePoints(
  database: typeof db,
  userId: string,
  input: RouteUpdatePointsInput,
): Promise<void> {
  await database.transaction(async (tx) => {
    const row = await findOwnedRouteForUpdate(tx, userId, input.id);
    if (!row) throw new TRPCError({ code: "NOT_FOUND" });
    const existing = toRoute(row);
    if (
      getRoutePointsHash(existing.points) === getRoutePointsHash(input.points)
    )
      return;
    const changes = {
      points: JSON.stringify(input.points),
      updatedAt: new Date(),
      ...CLEARED_DIRECTION,
    };
    const updated = await updateOwnedRoute(tx, userId, input.id, changes);
    if (updated.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
    await ensureRouteDirection(tx, userId, {
      ...existing,
      ...changes,
      points: input.points,
    });
  });
}

/** 所有ルートの名前だけを保存する。地点・作成状況・経路は変更せず、対象なしはNOT_FOUND。 */
export async function updateRouteDetails(
  database: typeof db,
  userId: string,
  input: RouteUpdateDetailsInput,
): Promise<void> {
  const updated = await updateOwnedRoute(database, userId, input.id, {
    title: input.title,
    updatedAt: new Date(),
  });
  if (updated.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
}

/** 所有ルートを完了にする。完了済みなら更新せず、対象なしはNOT_FOUND。 */
export async function completeRoute(
  database: typeof db,
  userId: string,
  id: number,
): Promise<void> {
  await database.transaction(async (tx) => {
    const row = await findOwnedRouteForUpdate(tx, userId, id);
    if (!row) throw new TRPCError({ code: "NOT_FOUND" });
    if (row.status === "completed") return;
    const updated = await updateOwnedRoute(tx, userId, id, {
      status: "completed",
      updatedAt: new Date(),
    });
    if (updated.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
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
    const direction = await tryGetDirection(tx, userId, {
      routePoints: points,
    });
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
