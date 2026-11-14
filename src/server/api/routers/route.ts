import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { createTRPCRouter } from "~/server/api/trpc";
import { protectedProcedure } from "../procedure";
import { routes } from "~/server/db/schema";
import { ensureRouteDirection } from "~/server/api/services/ensureRouteDirection";
import { getRoutePointsHash } from "~/server/api/services/routeDirectionCache";
import {
  routeCreateSchema,
  routeDeleteSchema,
  routePointsSchema,
  routeUpdateSchema,
} from "~/shared/schemas";

export const routeRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const [route] = await tx
          .select()
          .from(routes)
          .where(
            and(
              eq(routes.id, input.id),
              eq(routes.createdById, ctx.session.user.id),
            ),
          )
          .for("update");

        if (!route) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const points = routePointsSchema.parse(JSON.parse(route.points));
        // 最初に取得・検証した行を使い、ロックはこのトランザクションの終了まで保持する。
        const directionResult = await ensureRouteDirection(
          tx,
          ctx.session.user.id,
          { ...route, points },
        );
        return {
          id: route.id,
          title: route.title,
          points,
          createdById: route.createdById,
          createdAt: route.createdAt,
          updatedAt: route.updatedAt,
          ...directionResult,
        };
      });
    }),

  create: protectedProcedure
    .input(routeCreateSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        const [created] = await tx
          .insert(routes)
          .values({
            title: input.title,
            points: JSON.stringify(input.points),
            createdById: ctx.session.user.id,
          })
          .returning();
        if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // 計算に失敗しても登録地点は保存し、詳細取得時に再試行できるようにする。
        await ensureRouteDirection(tx, ctx.session.user.id, {
          ...created,
          points: routePointsSchema.parse(JSON.parse(created.points)),
        });
      });
    }),

  update: protectedProcedure
    .input(routeUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        const ownerCondition = and(
          eq(routes.id, input.id),
          eq(routes.createdById, ctx.session.user.id),
        );
        const [existing] = await tx
          .select()
          .from(routes)
          .where(ownerCondition)
          .for("update");
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
        const previousPoints = routePointsSchema.parse(
          JSON.parse(existing.points),
        );
        const pointsChanged =
          getRoutePointsHash(previousPoints) !==
          getRoutePointsHash(input.points);
        const changes = {
          title: input.title,
          points: JSON.stringify(input.points),
          updatedAt: new Date(),
          ...(pointsChanged
            ? {
                encodedPolyline: null,
                distanceMeters: null,
                duration: null,
                directionSource: null,
                directionCalculatedAt: null,
                directionPointsHash: null,
              }
            : {}),
        };
        const updated = await tx
          .update(routes)
          .set(changes)
          .where(
            and(
              eq(routes.id, input.id),
              eq(routes.createdById, ctx.session.user.id),
            ),
          );

        // 所有者条件で一致しない、または既に削除済みのときは成功にしない。
        if (updated.count === 0) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        if (pointsChanged)
          await ensureRouteDirection(tx, ctx.session.user.id, {
            ...existing,
            ...changes,
            points: input.points,
          });
      });
    }),

  delete: protectedProcedure
    .input(routeDeleteSchema)
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(routes)
        .where(
          and(
            eq(routes.id, input.id),
            eq(routes.createdById, ctx.session.user.id),
          ),
        );

      // 所有者条件で一致しない、または既に削除済みのときは成功にしない。
      if (deleted.count === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
    }),

  getByUser: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: routes.id,
        title: routes.title,
        createdById: routes.createdById,
        createdAt: routes.createdAt,
        updatedAt: routes.updatedAt,
      })
      .from(routes)
      .where(eq(routes.createdById, ctx.session.user.id));
  }),
});
