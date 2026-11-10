import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { db as Database } from "~/server/db";
import { routes } from "~/server/db/schema";
import { routePointsSchema } from "~/shared/schemas";
import { computeRoute } from "~/server/features/googlemap/computeRoute";
import { checkQuota, incrementQuota } from "~/server/quota/service";
import {
  getReusableRouteDirection,
  getRoutePointsHash,
  type SavedRouteDirection,
} from "./routeDirectionCache";

// APIへの接続は、両環境のCron設定と成功履歴の確認後に行う。
export async function getOrComputeRouteDirection(
  db: Pick<typeof Database, "transaction">,
  userId: string,
  routeId: number,
): Promise<SavedRouteDirection> {
  return db.transaction(async (tx) => {
    const ownerCondition = and(
      eq(routes.id, routeId),
      eq(routes.createdById, userId),
    );
    // プロセス内のロックでは別インスタンスからの計算を防げない。
    // 行ロック取得後に最新の保存値を判定し、同一ルートの再計算を直列化する。
    const [route] = await tx
      .select()
      .from(routes)
      .where(ownerCondition)
      .for("update");
    if (!route) throw new TRPCError({ code: "NOT_FOUND" });

    const points = routePointsSchema.parse(JSON.parse(route.points));
    const reusable = getReusableRouteDirection(route, points, new Date());
    if (reusable) return reusable;

    const quotaCheckedAt = new Date();
    let isQuotaExceeded = false;
    try {
      await checkQuota(tx, userId, "direction");
    } catch (error) {
      if (!(error instanceof TRPCError) || error.code !== "TOO_MANY_REQUESTS") {
        throw error;
      }
      isQuotaExceeded = true;
    }

    const pointsHash = getRoutePointsHash(points);
    let result: SavedRouteDirection;
    if (isQuotaExceeded) {
      result = {
        directionSource: "straight_line",
        encodedPolyline: null,
        distanceMeters: null,
        duration: null,
        directionCalculatedAt: quotaCheckedAt,
        directionPointsHash: pointsHash,
        path: points,
      };
    } else {
      const direction = await computeRoute({
        routePoints: points,
        travelMode: "WALK",
      });
      const calculatedAt = new Date();
      const validated = getReusableRouteDirection(
        {
          directionSource: "routes_api",
          encodedPolyline: direction.encodedPolyline,
          distanceMeters: direction.distanceMeters,
          duration: direction.duration,
          directionCalculatedAt: calculatedAt,
          directionPointsHash: pointsHash,
        },
        points,
        calculatedAt,
      );
      if (!validated) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      result = validated;
      await incrementQuota(tx, userId, "direction");
    }

    const updated = await tx
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
      .where(ownerCondition);
    if (updated.count === 0) throw new TRPCError({ code: "NOT_FOUND" });

    return result;
  });
}
