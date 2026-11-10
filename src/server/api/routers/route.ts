import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { createTRPCRouter } from "~/server/api/trpc";
import { protectedProcedure } from "../procedure";
import { routes } from "~/server/db/schema";
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
      const route = await ctx.db.query.routes.findFirst({
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
      };
    }),

  create: protectedProcedure
    .input(routeCreateSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(routes).values({
        title: input.title,
        points: JSON.stringify(input.points),
        createdById: ctx.session.user.id,
      });
    }),

  update: protectedProcedure
    .input(routeUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db
        .update(routes)
        .set({
          title: input.title,
          points: JSON.stringify(input.points),
          updatedAt: new Date(),
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
