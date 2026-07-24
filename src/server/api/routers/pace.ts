import { createTRPCRouter } from "~/server/api/trpc";
import { publicProcedure } from "../procedure";
import { paces } from "~/server/db/schema";

export const paceRouter = createTRPCRouter({
  getPace: publicProcedure.query(async ({ ctx }) => {
    const res = await ctx.db.select().from(paces);

    return res;
  }),
});
