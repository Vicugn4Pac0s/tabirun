import { and, eq } from "drizzle-orm";

import {
  createTRPCRouter,
} from "~/server/api/trpc";
import { protectedProcedure } from "../procedure";
import { routes } from "~/server/db/schema";
import {
  routeCreateSchema,
  routePointsSchema,
  routeUpdateSchema,
} from "~/shared/schemas";

export const routeRouter = createTRPCRouter({

  create: protectedProcedure
    .input(routeCreateSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(routes).values({
        title: input.title,
        points: JSON.stringify(input.points),
        kilometers: input.kilometers,
        createdById: ctx.session.user.id,
      });
    }),

  update: protectedProcedure
    .input(routeUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(routes)
        .set({
          title: input.title,
          points: JSON.stringify(input.points),
          kilometers: input.kilometers,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(routes.id, input.id),
            eq(routes.createdById, ctx.session.user.id),
          ),
        );
    }),
  
  getByUser: protectedProcedure.query(async ({ ctx }) => {
    const res = await ctx.db
      .select()
      .from(routes)
      .where(eq(routes.createdById, ctx.session.user.id));

    return res.map(route => ({
      ...route,
      points: routePointsSchema.parse(JSON.parse(route.points)),
    }));
  }),
});
