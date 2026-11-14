import { createTRPCRouter } from "~/server/api/trpc";
import { publicProcedure } from "../procedure";
import { getPaces } from "~/server/features/pace/paces";

export const paceRouter = createTRPCRouter({
  getPace: publicProcedure.query(({ ctx }) => getPaces(ctx.db)),
});
