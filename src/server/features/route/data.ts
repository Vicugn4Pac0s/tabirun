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

/**
 * 所有ルートを行ロック付きで取得し、見つからない・他人のルートならundefinedを返す。
 * 呼出側のトランザクションを渡し、後続の更新・経路計算にも同じトランザクションを使う。
 */
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

/**
 * 指定ユーザーを所有者としてルートを登録し、登録行の配列を返す。
 * 経路計算と一緒に確定させるため、呼出側のトランザクション内で使う。
 */
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

/**
 * IDと所有者が一致するルートを更新し、更新したIDの配列を返す。
 * 対象がなければ空配列を返す。取得時のロックを維持する同じトランザクション内で使う。
 */
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

/**
 * IDと所有者が一致するルートを削除し、削除したIDの配列を返す。
 * 見つからない・他人のルートなら空配列を返す。
 */
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

/**
 * 指定ユーザーのルート一覧を返し、登録がなければ空配列を返す。
 * 一覧で不要な地点JSON・経路キャッシュは取得しない。
 */
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

/**
 * 所有ルートの経路キャッシュを保存し、更新したIDの配列を返す。更新日は変更しない。
 * 対象がなければ空配列を返す。取得・計算と同じトランザクション内で使う。
 */
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

/**
 * DB行の地点JSONを検証し、アプリで扱う地点配列に変換する。
 * JSONの解析や地点の検証に失敗した場合は例外を伝播する。
 */
export function toRoute(row: typeof routes.$inferSelect) {
  return { ...row, points: routePointsSchema.parse(JSON.parse(row.points)) };
}
