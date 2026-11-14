import { z } from "zod";
import { createTRPCRouter } from "~/server/api/trpc";
import { protectedProcedure } from "../procedure";
import {
  createRoute,
  deleteRoute,
  getRouteDetail,
  getUserRoutes,
  updateRoute,
} from "~/server/features/route/operations";
import {
  routeCreateSchema,
  routeDeleteSchema,
  routeUpdateSchema,
} from "~/shared/schemas";

export const routeRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(({ ctx, input }) =>
      getRouteDetail(ctx.db, ctx.session.user.id, input.id),
    ),
  create: protectedProcedure
    .input(routeCreateSchema)
    .mutation(({ ctx, input }) =>
      createRoute(ctx.db, ctx.session.user.id, input),
    ),
  update: protectedProcedure
    .input(routeUpdateSchema)
    .mutation(({ ctx, input }) =>
      updateRoute(ctx.db, ctx.session.user.id, input),
    ),
  delete: protectedProcedure
    .input(routeDeleteSchema)
    .mutation(({ ctx, input }) =>
      deleteRoute(ctx.db, ctx.session.user.id, input.id),
    ),
  getByUser: protectedProcedure.query(({ ctx }) =>
    getUserRoutes(ctx.db, ctx.session.user.id),
  ),
});
