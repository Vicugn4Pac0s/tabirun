import { createTRPCRouter } from "~/server/api/trpc";
import { protectedProcedure } from "../procedure";
import {
  getUserRoutes,
  getUserDrafts,
  getRouteDetail,
  createRouteDraft,
  updateRoutePoints,
  updateRouteDetails,
  completeRoute,
  deleteRoute,
} from "~/server/features/route/service";
import {
  routeIdSchema,
  routeCreateDraftSchema,
  routeUpdatePointsSchema,
  routeUpdateDetailsSchema,
  routeDeleteSchema,
} from "~/shared/schemas";

export const routeRouter = createTRPCRouter({
  getByUser: protectedProcedure.query(({ ctx }) =>
    getUserRoutes(ctx.db, ctx.session.user.id),
  ),
  getDrafts: protectedProcedure.query(({ ctx }) =>
    getUserDrafts(ctx.db, ctx.session.user.id),
  ),
  getById: protectedProcedure
    .input(routeIdSchema)
    .query(({ ctx, input }) =>
      getRouteDetail(ctx.db, ctx.session.user.id, input.id),
    ),
  createDraft: protectedProcedure
    .input(routeCreateDraftSchema)
    .mutation(({ ctx, input }) =>
      createRouteDraft(ctx.db, ctx.session.user.id, input),
    ),
  updatePoints: protectedProcedure
    .input(routeUpdatePointsSchema)
    .mutation(({ ctx, input }) =>
      updateRoutePoints(ctx.db, ctx.session.user.id, input),
    ),
  updateDetails: protectedProcedure
    .input(routeUpdateDetailsSchema)
    .mutation(({ ctx, input }) =>
      updateRouteDetails(ctx.db, ctx.session.user.id, input),
    ),
  complete: protectedProcedure
    .input(routeIdSchema)
    .mutation(({ ctx, input }) =>
      completeRoute(ctx.db, ctx.session.user.id, input.id),
    ),
  delete: protectedProcedure
    .input(routeDeleteSchema)
    .mutation(({ ctx, input }) =>
      deleteRoute(ctx.db, ctx.session.user.id, input.id),
    ),
});
