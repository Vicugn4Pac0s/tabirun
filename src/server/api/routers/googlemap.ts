import { createTRPCRouter } from "~/server/api/trpc";
import { quotaProtectedProcedure } from "../procedure";
import { getDirection } from "~/server/features/googlemap/direction";
import {
  DirectionInputSchema,
  DirectionOutputSchema,
} from "~/server/features/googlemap/computeRoute";

export const googlemapRouter = createTRPCRouter({
  getDirection: quotaProtectedProcedure("direction")
    .input(DirectionInputSchema)
    .output(DirectionOutputSchema)
    .query(({ input, ctx }) =>
      getDirection(ctx.db, ctx.session.user.id, input),
    ),
});
