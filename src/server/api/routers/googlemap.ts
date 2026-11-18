import { createTRPCRouter } from "~/server/api/trpc";
import { quotaProtectedProcedure } from "../procedure";
import { getDirection } from "~/server/features/direction/service";
import { directionOutputSchema } from "~/server/features/direction/client";
import { directionInputSchema } from "~/shared/schemas";

export const googlemapRouter = createTRPCRouter({
  getDirection: quotaProtectedProcedure("direction")
    .input(directionInputSchema)
    .output(directionOutputSchema)
    .query(({ input, ctx }) =>
      getDirection(ctx.db, ctx.session.user.id, input),
    ),
});
