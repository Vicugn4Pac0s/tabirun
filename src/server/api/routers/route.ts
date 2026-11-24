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
  createRoute,
  updateRoute,
} from "~/server/features/route/service";
import {
  routeIdSchema,
  routeCreateDraftSchema,
  routeUpdatePointsSchema,
  routeUpdateDetailsSchema,
  routeDeleteSchema,
  routeCreateSchema,
  routeUpdateSchema,
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
  // 既存画面が利用するため、画面分割で新APIへ移行するまで残す。
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
});
