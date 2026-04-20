import { eq } from "drizzle-orm";

import { createTRPCRouter } from "~/server/api/trpc";
import { protectedProcedure } from "../procedure";
import { userProfileUpdateSchema } from "~/shared/schemas";
import { users } from "~/server/db/schema";

export const userRouter = createTRPCRouter({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        birthDate: true,
        gender: true,
        pace: true,
        height: true,
        weight: true,
      },
    });

    return user ?? null;
  }),

  updateProfile: protectedProcedure
    .input(userProfileUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({
          ...(input.birthDate !== undefined
            ? { birthDate: input.birthDate }
            : {}),
          ...(input.gender !== undefined ? { gender: input.gender } : {}),
          ...(input.pace !== undefined ? { pace: input.pace } : {}),
          ...(input.height !== undefined ? { height: input.height } : {}),
          ...(input.weight !== undefined ? { weight: input.weight } : {}),
        })
        .where(eq(users.id, ctx.session.user.id));

      return ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
          birthDate: true,
          gender: true,
          pace: true,
          height: true,
          weight: true,
        },
      });
    }),
});
