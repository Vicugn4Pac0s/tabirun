import { createTRPCRouter } from "~/server/api/trpc";
import { protectedProcedure } from "../procedure";
import {
  completeInitialProfile,
  getCurrentProfile,
  updateProfile,
} from "~/server/features/user/profile";
import {
  userInitialProfileSchema,
  userProfileUpdateSchema,
} from "~/shared/schemas";

export const userRouter = createTRPCRouter({
  getCurrent: protectedProcedure.query(({ ctx }) =>
    getCurrentProfile(ctx.db, ctx.session.user.id),
  ),
  updateProfile: protectedProcedure
    .input(userProfileUpdateSchema)
    .mutation(({ ctx, input }) =>
      updateProfile(ctx.db, ctx.session.user.id, input),
    ),
  completeInitialProfile: protectedProcedure
    .input(userInitialProfileSchema)
    .mutation(({ ctx, input }) =>
      completeInitialProfile(ctx.db, ctx.session.user.id, input),
    ),
});
