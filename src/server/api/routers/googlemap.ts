import { createTRPCRouter } from "~/server/api/trpc";
import { quotaProtectedProcedure } from "../procedure";
import { getDirection } from "~/server/features/googlemap/direction";
import { DirectionOutputSchema } from "~/server/features/googlemap/computeRoute";
import { directionInputSchema } from "~/shared/schemas";

export const googlemapRouter = createTRPCRouter({
  getDirection: quotaProtectedProcedure("direction")
    .input(directionInputSchema)
    .output(DirectionOutputSchema)
    .query(({ input, ctx }) =>
      getDirection(ctx.db, ctx.session.user.id, input),
    ),
});
