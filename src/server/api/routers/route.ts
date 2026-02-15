import { eq } from "drizzle-orm";

import {
  createTRPCRouter,
} from "~/server/api/trpc";
import { protectedProcedure, publicProcedure } from "../procedure";
import { routes } from "~/server/db/schema";
import { routeCreateSchema } from "~/shared/schemas";

export const routeRouter = createTRPCRouter({

  create: protectedProcedure
    .input(routeCreateSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(routes).values({
        title: input.title,
        points: JSON.stringify(input.points),
        createdById: ctx.session.user.id,
      });
    }),
  
  getByUser: protectedProcedure.query(async ({ ctx }) => {
    const res = await ctx.db
      .select()
      .from(routes)
      .where(eq(routes.createdById, ctx.session.user.id));

    return res.map(route => ({
      ...route,
      points: JSON.parse(route.points),
    }));
  }),
});
