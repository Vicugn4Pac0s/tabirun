import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { createTRPCRouter } from "~/server/api/trpc";
import { protectedProcedure } from "../procedure";
import { routes } from "~/server/db/schema";
import { getRouteDirectionResult } from "~/server/api/services/getOrComputeRouteDirection";
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
        const directionResult = await getRouteDirectionResult(
          tx,
          ctx.session.user.id,
          input.id,
        );
        // 経路の取得とルート情報の読み取りを同じトランザクションで行い、地点の不一致を防ぐ。
        const route = await tx.query.routes.findFirst({
          columns: {
            id: true,
            title: true,
            points: true,
            createdById: true,
            createdAt: true,
            updatedAt: true,
          },
          where: and(
            eq(routes.id, input.id),
            eq(routes.createdById, ctx.session.user.id),
          ),
        });

        if (!route) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        return {
          ...route,
          points: routePointsSchema.parse(JSON.parse(route.points)),
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
          .returning({ id: routes.id });
        if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // 計算に失敗しても登録地点は保存し、詳細取得時に再試行できるようにする。
        await getRouteDirectionResult(tx, ctx.session.user.id, created.id);
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
        const updated = await tx
          .update(routes)
          .set({
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
          })
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
          await getRouteDirectionResult(tx, ctx.session.user.id, input.id);
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
    const res = await ctx.db
      .select({
        id: routes.id,
        title: routes.title,
        points: routes.points,
        createdById: routes.createdById,
        createdAt: routes.createdAt,
        updatedAt: routes.updatedAt,
      })
      .from(routes)
      .where(eq(routes.createdById, ctx.session.user.id));

    return res.map((route) => ({
      ...route,
      points: routePointsSchema.parse(JSON.parse(route.points)),
    }));
  }),
});
