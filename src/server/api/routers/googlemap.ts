import { createTRPCRouter } from "~/server/api/trpc";
import { quotaProtectedProcedure } from "../procedure";
import { incrementQuota } from "~/server/quota/service";
import {
  computeRoute,
  DirectionInputSchema,
  DirectionOutputSchema,
} from "~/server/features/googlemap/computeRoute";

export type { GoogleRouteDirection } from "~/server/features/googlemap/computeRoute";

export const googlemapRouter = createTRPCRouter({
  getDirection: quotaProtectedProcedure("direction")
    .input(DirectionInputSchema)
    .output(DirectionOutputSchema)
    .query(async ({ input, ctx }) => {
      const direction = await computeRoute(input);
      await incrementQuota(ctx.db, ctx.session.user.id, "direction");
      return direction;
    }),
});
